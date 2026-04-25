import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';

function todayDate() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

export class TransactionTemplateService {

  async list(userId: string) {
    return prisma.transactionTemplate.findMany({
      where: { userId },
      orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
      include: { card: { select: { id: true, name: true, lastDigits: true, color: true, brand: true } } },
    });
  }

  // Templates mais usados pra exibir na home (top N)
  async listTop(userId: string, limit = 6) {
    return prisma.transactionTemplate.findMany({
      where: { userId },
      orderBy: [{ useCount: 'desc' }, { lastUsedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: { card: { select: { id: true, name: true, lastDigits: true, color: true, brand: true } } },
    });
  }

  async findById(userId: string, id: string) {
    const tpl = await prisma.transactionTemplate.findFirst({
      where: { id, userId },
      include: { card: { select: { id: true, name: true, lastDigits: true, color: true, brand: true } } },
    });
    if (!tpl) throw new AppError(404, 'Template não encontrado');
    return tpl;
  }

  async create(userId: string, data: any) {
    if (data.cardId) {
      const card = await prisma.creditCard.findFirst({ where: { id: data.cardId, userId } });
      if (!card) throw new AppError(400, 'Cartão informado não pertence ao usuário');
    }
    return prisma.transactionTemplate.create({
      data: {
        userId,
        label:         data.label,
        type:          data.type,
        defaultValue:  data.defaultValue ?? null,
        valueRequired: data.valueRequired ?? true,
        category:      data.category,
        paymentMethod: data.paymentMethod,
        cardId:        data.cardId ?? null,
        icon:          data.icon ?? null,
        color:         data.color ?? null,
      },
    });
  }

  async update(userId: string, id: string, data: any) {
    await this.findById(userId, id);
    if (data.cardId) {
      const card = await prisma.creditCard.findFirst({ where: { id: data.cardId, userId } });
      if (!card) throw new AppError(400, 'Cartão informado não pertence ao usuário');
    }
    const patch: any = {};
    for (const k of ['label', 'type', 'defaultValue', 'valueRequired', 'category',
                     'paymentMethod', 'cardId', 'icon', 'color']) {
      if (data[k] !== undefined) patch[k] = data[k];
    }
    return prisma.transactionTemplate.update({ where: { id }, data: patch });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await prisma.transactionTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  // Usa o template: cria a transação e incrementa useCount/lastUsedAt.
  // Se valueRequired=true, exige que `valueOverride` seja passado.
  async use(userId: string, id: string, valueOverride?: number) {
    const tpl = await this.findById(userId, id);

    let finalValue: number;
    if (tpl.valueRequired) {
      if (!valueOverride || valueOverride <= 0) {
        throw new AppError(400, 'Este template exige um valor');
      }
      finalValue = valueOverride;
    } else {
      finalValue = valueOverride && valueOverride > 0 ? valueOverride : Number(tpl.defaultValue ?? 0);
      if (finalValue <= 0) throw new AppError(400, 'Template sem valor padrão configurado');
    }

    const now = todayDate();

    const tx = await prisma.transaction.create({
      data: {
        userId,
        type:          tpl.type,
        description:   tpl.label.toUpperCase(),
        category:      tpl.category,
        value:         finalValue,
        date:          now,
        paymentMethod: tpl.paymentMethod,
        cardId:        tpl.cardId,
        status:        'realizado',
        recurring:     false,
        month:         now.getMonth() + 1,
        year:          now.getFullYear(),
      },
    });

    await prisma.transactionTemplate.update({
      where: { id },
      data: {
        useCount:   { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    return { transaction: tx, templateId: id };
  }
}

export const transactionTemplateService = new TransactionTemplateService();
