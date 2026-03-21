import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { notificationService } from './notification.service';

export class CardService {

  async list(userId: string) {
    return prisma.creditCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(userId: string, id: string) {
    const card = await prisma.creditCard.findFirst({ where: { id, userId } });
    if (!card) throw new AppError(404, 'Cart\u00E3o n\u00E3o encontrado');
    return card;
  }

  async getTransactions(userId: string, cardId: string, month?: number, year?: number) {
    const card = await this.findById(userId, cardId);
    const where: any = { userId, cardId };
    if (month && year) { where.month = month; where.year = year; }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    const total = transactions.reduce((s, t) => s + t.value, 0);

    return { card, transactions, total };
  }

  async create(userId: string, data: any) {
    return prisma.creditCard.create({
      data: {
        userId,
        name: data.name,
        lastDigits: data.lastDigits,
        brand: data.brand,
        color: data.color,
        limit: data.limit,
        used: 0,
        closingDay: data.closingDay,
        dueDay: data.dueDay,
        type: data.type,
      },
    });
  }

  async update(userId: string, id: string, data: any) {
    await this.findById(userId, id);
    return prisma.creditCard.update({ where: { id }, data });
  }

  async delete(userId: string, id: string) {
    await this.findById(userId, id);
    // Desvincular transa\u00E7\u00F5es antes de deletar
    await prisma.transaction.updateMany({
      where: { cardId: id },
      data: { cardId: null },
    });
    await prisma.creditCard.delete({ where: { id } });
    return { deleted: true };
  }

  async payBill(userId: string, cardId: string, billMonth: number, billYear: number) {
    const card = await this.findById(userId, cardId);

    // Verificar se j\u00E1 foi paga
    const existingPayment = await prisma.transaction.findFirst({
      where: { userId, cardId, billMonth, billYear, type: 'pagamento_fatura' },
    });
    if (existingPayment) throw new AppError(409, 'Esta fatura j\u00E1 foi paga');

    // Calcular total da fatura
    const txs = await prisma.transaction.findMany({
      where: { userId, cardId, billMonth, billYear, type: { not: 'pagamento_fatura' } },
    });
    const billTotal = txs.reduce((s, t) => s + t.value, 0);
    if (billTotal <= 0) throw new AppError(400, 'Fatura sem transa\u00E7\u00F5es para pagar');

    // Criar transa\u00E7\u00E3o de pagamento
    await prisma.transaction.create({
      data: {
        userId,
        type: 'pagamento_fatura',
        description: `PAGAMENTO FATURA ${card.name.toUpperCase()} ${String(billMonth).padStart(2, '0')}/${billYear}`,
        category: 'contas',
        value: billTotal,
        date: new Date(),
        paymentMethod: 'transferencia',
        cardId,
        status: 'realizado',
        recurring: false,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        billMonth,
        billYear,
      },
    });

    // Restaurar limite
    const previousUsed = card.used;
    const newUsed = Math.max(0, card.used - billTotal);
    await prisma.creditCard.update({
      where: { id: cardId },
      data: { used: newUsed },
    });

    return { cardId, billMonth, billYear, billTotal, previousUsed, newUsed };
  }
}

export const cardService = new CardService();
