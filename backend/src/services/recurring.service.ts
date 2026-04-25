import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { notificationService } from './notification.service';

// Devolve a data (sem hora) em que o template DEVE gerar a próxima transação
// considerando uma data de referência. Retorna null se a data de referência
// é anterior ao startDate ou posterior ao endDate.
function dateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function lastDayOfMonth(year: number, month0: number) {
  return new Date(year, month0 + 1, 0).getDate();
}

// Lista todas as datas (sem hora) entre `from` (exclusive) e `to` (inclusive)
// em que o template deveria ter gerado uma transação. Usado pra cobrir backfill
// quando o servidor ficou off por alguns dias.
function dueDatesBetween(template: {
  frequency: string;
  dayOfMonth: number | null;
  weekday: number | null;
  startDate: Date;
  endDate: Date | null;
}, from: Date | null, to: Date): Date[] {
  const start = dateOnly(template.startDate);
  const end = template.endDate ? dateOnly(template.endDate) : null;
  const upper = end && end < to ? end : dateOnly(to);
  const lowerInclusive = from ? new Date(dateOnly(from).getTime() + 86_400_000) : start;
  const cursor = lowerInclusive < start ? start : lowerInclusive;

  const dates: Date[] = [];
  if (cursor > upper) return dates;

  if (template.frequency === 'daily') {
    for (let d = new Date(cursor); d <= upper; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  }

  if (template.frequency === 'weekly' && template.weekday != null) {
    for (let d = new Date(cursor); d <= upper; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === template.weekday) dates.push(new Date(d));
    }
    return dates;
  }

  if (template.frequency === 'monthly' && template.dayOfMonth != null) {
    // Itera mês a mês, ajustando dayOfMonth para o último dia se mês curto
    let y = cursor.getFullYear();
    let m = cursor.getMonth();
    while (true) {
      const day = Math.min(template.dayOfMonth, lastDayOfMonth(y, m));
      const candidate = new Date(y, m, day);
      if (candidate >= cursor && candidate <= upper) dates.push(candidate);
      if (candidate > upper) break;
      m += 1;
      if (m > 11) { m = 0; y += 1; }
      if (new Date(y, m, 1) > upper) break;
    }
    return dates;
  }

  return dates;
}

export class RecurringService {

  async list(userId: string) {
    return prisma.recurringTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { card: { select: { id: true, name: true, lastDigits: true, color: true, brand: true } } },
    });
  }

  async findById(userId: string, id: string) {
    const tpl = await prisma.recurringTemplate.findFirst({
      where: { id, userId },
      include: { card: { select: { id: true, name: true, lastDigits: true, color: true, brand: true } } },
    });
    if (!tpl) throw new AppError(404, 'Template recorrente não encontrado');
    return tpl;
  }

  async create(userId: string, data: any) {
    if (data.cardId) {
      const card = await prisma.creditCard.findFirst({ where: { id: data.cardId, userId } });
      if (!card) throw new AppError(400, 'Cartão informado não pertence ao usuário');
    }
    return prisma.recurringTemplate.create({
      data: {
        userId,
        type:          data.type,
        description:   data.description,
        category:      data.category,
        value:         data.value,
        paymentMethod: data.paymentMethod,
        cardId:        data.cardId ?? null,
        frequency:     data.frequency,
        dayOfMonth:    data.dayOfMonth ?? null,
        weekday:       data.weekday ?? null,
        startDate:     new Date(data.startDate + 'T12:00:00'),
        endDate:       data.endDate ? new Date(data.endDate + 'T12:00:00') : null,
        active:        data.active ?? true,
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
    for (const k of ['type', 'description', 'category', 'value', 'paymentMethod', 'cardId',
                     'frequency', 'dayOfMonth', 'weekday', 'active']) {
      if (data[k] !== undefined) patch[k] = data[k];
    }
    if (data.startDate !== undefined) patch.startDate = new Date(data.startDate + 'T12:00:00');
    if (data.endDate !== undefined)   patch.endDate   = data.endDate ? new Date(data.endDate + 'T12:00:00') : null;

    return prisma.recurringTemplate.update({ where: { id }, data: patch });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    await prisma.recurringTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  // Gera as transações pendentes pra um único template até a data `now`.
  // Idempotente: usa lastGeneratedAt + checagem de existência por (templateId, date).
  async runForTemplate(template: any, now: Date) {
    const dates = dueDatesBetween(
      {
        frequency:  template.frequency,
        dayOfMonth: template.dayOfMonth,
        weekday:    template.weekday,
        startDate:  template.startDate,
        endDate:    template.endDate,
      },
      template.lastGeneratedAt,
      now,
    );

    const created: { id: string; date: Date }[] = [];
    for (const d of dates) {
      // Defensive: confere que não existe transação já criada nesse dia pra esse template
      const existing = await prisma.transaction.findFirst({
        where: {
          recurringTemplateId: template.id,
          date: { gte: d, lt: new Date(d.getTime() + 86_400_000) },
        },
        select: { id: true },
      });
      if (existing) continue;

      const tx = await prisma.transaction.create({
        data: {
          userId:        template.userId,
          type:          template.type,
          description:   template.description.toUpperCase(),
          category:      template.category,
          value:         template.value,
          date:          d,
          paymentMethod: template.paymentMethod,
          cardId:        template.cardId,
          status:        'pendente',
          recurring:     true,
          month:         d.getMonth() + 1,
          year:          d.getFullYear(),
          recurringTemplateId: template.id,
        },
        select: { id: true, date: true },
      });
      created.push(tx);

      await notificationService.create(template.userId, {
        type: 'info',
        title: 'Transação recorrente lançada',
        message: `${template.description} (R$ ${Number(template.value).toFixed(2).replace('.', ',')}) — confirme se já foi paga.`,
        icon: template.type === 'entrada' ? '💰' : '🔁',
        actionLabel: 'Ver transação',
        actionRoute: '/transacoes',
        relatedAmount: Number(template.value),
      });
    }

    if (created.length > 0) {
      await prisma.recurringTemplate.update({
        where: { id: template.id },
        data:  { lastGeneratedAt: dateOnly(now) },
      });
    }

    return created;
  }

  // Roda pra todos os templates ativos. userId opcional restringe a um usuário.
  async generateDueTransactions(now: Date = new Date(), userId?: string) {
    const templates = await prisma.recurringTemplate.findMany({
      where: { active: true, ...(userId ? { userId } : {}) },
    });
    let totalCreated = 0;
    for (const tpl of templates) {
      const created = await this.runForTemplate(tpl, now);
      totalCreated += created.length;
    }
    return { templates: templates.length, transactionsCreated: totalCreated };
  }
}

export const recurringService = new RecurringService();
