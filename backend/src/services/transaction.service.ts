import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { notificationService } from './notification.service';

// ── Helpers de fatura ────────────────────────────────────

function getBillPeriod(date: Date, closingDay: number) {
  const day = date.getDate();
  let billMonth = date.getMonth() + 1;
  let billYear  = date.getFullYear();

  // Regra cr\u00EDtica: dia > closingDay \u2192 pr\u00F3xima fatura
  // dia == closingDay \u2192 fatura atual (pertence ao m\u00EAs corrente)
  if (day > closingDay) {
    billMonth += 1;
    if (billMonth > 12) { billMonth = 1; billYear += 1; }
  }

  return { billMonth, billYear };
}

function advanceMonths(month: number, year: number, n: number) {
  let m = month + n;
  let y = year;
  while (m > 12) { m -= 12; y += 1; }
  return { month: m, year: y };
}

const MONTH_PT = ['Janeiro','Fevereiro','Mar\u00E7o','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getBillStatus(billMonth: number, billYear: number, closingDay: number, dueDay: number) {
  const now = new Date();
  const day = now.getDate();
  const cm  = now.getMonth() + 1;
  const cy  = now.getFullYear();

  if (billYear > cy || (billYear === cy && billMonth > cm)) return 'futura';
  if (billYear === cy && billMonth === cm) {
    if (day < closingDay)  return 'aberta';
    if (day <= dueDay)     return 'fechada';
    return 'vencida';
  }
  return 'vencida';
}

// ── Service ──────────────────────────────────────────────

export class TransactionService {

  async list(userId: string, query: any) {
    const where: any = { userId };
    if (query.month && query.year) { where.month = query.month; where.year = query.year; }
    if (query.type)      where.type     = query.type;
    if (query.category)  where.category = query.category;
    if (query.status)    where.status   = query.status;
    if (query.cardId)    where.cardId   = query.cardId;
    if (query.search)    where.description = { contains: query.search, mode: 'insensitive' };
    if (query.billMonth && query.billYear) {
      where.billMonth = query.billMonth;
      where.billYear  = query.billYear;
    }

    const data = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        card: { select: { id: true, name: true, lastDigits: true, color: true, brand: true } },
      },
    });

    return { data, meta: { count: data.length } };
  }

  async findById(userId: string, id: string) {
    const tx = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { card: { select: { id: true, name: true, lastDigits: true, color: true, brand: true } } },
    });
    if (!tx) throw new AppError(404, 'Transa\u00E7\u00E3o n\u00E3o encontrada');
    return tx;
  }

  async create(userId: string, data: any) {
    const dateObj = new Date(data.date + 'T12:00:00');
    const month = dateObj.getMonth() + 1;
    const year  = dateObj.getFullYear();

    let card: any = null;
    if (data.cardId) {
      card = await prisma.creditCard.findFirst({ where: { id: data.cardId, userId } });
      if (!card) throw new AppError(400, 'Cart\u00E3o n\u00E3o encontrado');
    }

    // Verificar limite
    if (card && ['saida', 'saida_futura'].includes(data.type) && (data.status || 'realizado') === 'realizado') {
      const available = card.limit - card.used;
      const needed = (data.installment && data.installmentTotal >= 2)
        ? data.value * data.installmentTotal
        : data.value;
      if (needed > available + 0.01) {
        throw new AppError(400,
          `Limite insuficiente. Dispon\u00EDvel: R$ ${available.toFixed(2).replace('.', ',')} | Necess\u00E1rio: R$ ${needed.toFixed(2).replace('.', ',')}`
        );
      }
    }

    // Parcelamento
    if (data.installment && data.installmentTotal >= 2 && card) {
      return this._createInstallments(userId, data, card, dateObj, month, year);
    }

    // Transa\u00E7\u00E3o simples
    let billMonth: number | null = null;
    let billYear:  number | null = null;
    if (card && ['saida', 'saida_futura'].includes(data.type)) {
      const b = getBillPeriod(dateObj, card.closingDay);
      billMonth = b.billMonth;
      billYear  = b.billYear;
    }

    const tx = await prisma.transaction.create({
      data: {
        userId,
        type: data.type,
        description: data.description.toUpperCase(),
        category: data.category,
        value: data.value,
        date: dateObj,
        paymentMethod: data.paymentMethod,
        cardId: data.cardId || null,
        status: data.status || 'realizado',
        recurring: data.recurring || false,
        month,
        year,
        linkedPreviewId: data.linkedPreviewId || null,
        installment: false,
        billMonth,
        billYear,
      },
      include: { card: { select: { id: true, name: true, lastDigits: true, color: true, brand: true } } },
    });

    // Atualizar linked previsto
    if (data.linkedPreviewId && ['saida', 'saida_futura'].includes(data.type)) {
      await this._checkForecastCompletion(data.linkedPreviewId, userId);
    }

    // Atualizar limite
    if (card && ['saida', 'saida_futura'].includes(data.type) && (data.status || 'realizado') === 'realizado') {
      const updated = await prisma.creditCard.update({
        where: { id: card.id },
        data: { used: { increment: data.value } },
      });
      await notificationService.checkCardLimit(userId, updated);
    }

    let _billMessage = '';
    if (billMonth && billYear) {
      const pm = dateObj.getMonth() + 1;
      _billMessage = billMonth !== pm
        ? `Fatura de ${MONTH_PT[pm - 1]} j\u00E1 encerrada. Lan\u00E7ado em ${MONTH_PT[billMonth - 1]}.`
        : `Lan\u00E7ado na fatura de ${MONTH_PT[billMonth - 1]}.`;
    }

    return { data: tx, _billMessage: _billMessage || undefined };
  }

  private async _createInstallments(userId: string, data: any, card: any, dateObj: Date, _month: number, _year: number) {
    const n         = data.installmentTotal;
    const parcela   = data.value;
    const total     = parcela * n;
    const firstBill = getBillPeriod(dateObj, card.closingDay);
    const txs: any[] = [];

    for (let i = 0; i < n; i++) {
      const bill = advanceMonths(firstBill.billMonth, firstBill.billYear, i);
      const t = await prisma.transaction.create({
        data: {
          userId,
          type: data.type,
          description: `${data.description.toUpperCase()} (${i + 1}/${n})`,
          category: data.category,
          value: parcela,
          date: dateObj,
          paymentMethod: data.paymentMethod,
          cardId: card.id,
          status: data.status || 'realizado',
          recurring: false,
          month: bill.month,
          year: bill.year,
          installment: true,
          installmentTotal: n,
          installmentNumber: i + 1,
          totalValue: total,
          billMonth: bill.month,
          billYear: bill.year,
        },
        include: { card: { select: { id: true, name: true, lastDigits: true, color: true, brand: true } } },
      });
      txs.push(t);
    }

    // Setar parentId nas filhas
    const parentId = txs[0].id;
    await Promise.all(
      txs.slice(1).map(t => prisma.transaction.update({ where: { id: t.id }, data: { parentId } }))
    );

    if ((data.status || 'realizado') === 'realizado') {
      const updated = await prisma.creditCard.update({
        where: { id: card.id },
        data: { used: { increment: total } },
      });
      await notificationService.checkCardLimit(userId, updated);
    }

    // Notifica\u00E7\u00E3o de parcelamento criado
    await notificationService.create(userId, {
      type: 'info',
      title: 'Parcelamento criado',
      message: `${data.description.toUpperCase()} \u2014 ${n}x de R$ ${parcela.toFixed(2).replace('.', ',')}`,
      icon: '\u{1F4B3}',
      relatedAmount: total,
      actionLabel: 'Ver Cart\u00E3o',
      actionRoute: '/cartoes',
    });

    const firstBillName = MONTH_PT[firstBill.billMonth - 1];
    const lastBill      = advanceMonths(firstBill.billMonth, firstBill.billYear, n - 1);
    const lastBillName  = MONTH_PT[lastBill.month - 1];

    return {
      data: txs[0],
      _billMessage: `${n}x de R$ ${parcela.toFixed(2).replace('.', ',')}. Primeira: ${firstBillName}, \u00FAltima: ${lastBillName}.`,
      _installmentInfo: {
        totalParcelas: n, valorParcela: parcela, valorTotal: total,
        parcelas: txs.map(t => ({ id: t.id, number: t.installmentNumber, billMonth: t.billMonth, billYear: t.billYear })),
      },
    };
  }

  async update(userId: string, id: string, data: any) {
    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw new AppError(404, 'Transa\u00E7\u00E3o n\u00E3o encontrada');

    if (data.cardId) {
      const c = await prisma.creditCard.findFirst({ where: { id: data.cardId, userId } });
      if (!c) throw new AppError(400, 'Cart\u00E3o n\u00E3o encontrado');
    }

    let month = existing.month;
    let year  = existing.year;
    if (data.date) {
      const d = new Date(data.date + 'T12:00:00');
      month = d.getMonth() + 1;
      year  = d.getFullYear();
    }

    // Reverter valor antigo no limite
    if (existing.cardId && ['saida', 'saida_futura'].includes(existing.type) && existing.status === 'realizado') {
      const oldCard = await prisma.creditCard.findUnique({ where: { id: existing.cardId } });
      if (oldCard) {
        await prisma.creditCard.update({
          where: { id: existing.cardId },
          data: { used: Math.max(0, oldCard.used - existing.value) },
        });
      }
    }

    if (data.description) data.description = data.description.toUpperCase();

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date + 'T12:00:00') : undefined,
        month,
        year,
      },
      include: { card: { select: { id: true, name: true, lastDigits: true, color: true, brand: true } } },
    });

    const finalCardId = data.cardId !== undefined ? data.cardId : existing.cardId;
    const finalType   = data.type   || existing.type;
    const finalStatus = data.status || existing.status;
    const finalValue  = data.value  ?? existing.value;

    if (finalCardId && ['saida', 'saida_futura'].includes(finalType) && finalStatus === 'realizado') {
      const card = await prisma.creditCard.update({
        where: { id: finalCardId },
        data: { used: { increment: finalValue } },
      });
      await notificationService.checkCardLimit(userId, card);
    }

    return { data: updated };
  }

  async delete(userId: string, id: string) {
    const tx = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!tx) throw new AppError(404, 'Transa\u00E7\u00E3o n\u00E3o encontrada');

    // Deletar parcelas filhas se for a m\u00E3e
    if (tx.installment && !tx.parentId) {
      if (tx.cardId && tx.status === 'realizado') {
        const totalValue = tx.totalValue || tx.value;
        const card = await prisma.creditCard.findUnique({ where: { id: tx.cardId } });
        if (card) {
          await prisma.creditCard.update({
            where: { id: tx.cardId },
            data: { used: Math.max(0, card.used - totalValue) },
          });
        }
      }
      await prisma.transaction.deleteMany({ where: { parentId: id } });
      await prisma.transaction.delete({ where: { id } });
      return { deleted: true, deletedInstallments: true };
    }

    if (tx.cardId && ['saida', 'saida_futura'].includes(tx.type) && tx.status === 'realizado') {
      const card = await prisma.creditCard.findUnique({ where: { id: tx.cardId } });
      if (card) {
        await prisma.creditCard.update({
          where: { id: tx.cardId },
          data: { used: Math.max(0, card.used - tx.value) },
        });
      }
    }

    await prisma.transaction.delete({ where: { id } });
    return { deleted: true };
  }

  async summary(userId: string, month: number, year: number) {
    const txs = await prisma.transaction.findMany({ where: { userId, month, year } });

    const entradas = txs
      .filter(t => t.type === 'entrada' && t.status === 'realizado')
      .reduce((s, t) => s + t.value, 0);

    const saidas = txs
      .filter(t => ['saida', 'saida_futura'].includes(t.type) && t.status === 'realizado')
      .reduce((s, t) => s + t.value, 0);

    const saldo    = entradas - saidas;
    const economia = entradas > 0 ? ((entradas - saidas) / entradas) * 100 : 0;

    // Calcular previsto restante
    const previstos = txs.filter(t => t.type === 'previsto' || (t.status === 'previsto' && t.type !== 'entrada'));
    let previsto = 0;
    for (const p of previstos) {
      const linked = await prisma.transaction.findMany({ where: { linkedPreviewId: p.id } });
      const consumed = linked.reduce((s, t) => s + t.value, 0);
      const remaining = p.value - consumed;
      if (remaining > 0) previsto += remaining;
    }

    return { entradas, saidas, saldo, economia, previsto, total: txs.length };
  }

  async getAvailableForecasts(userId: string, category: string, month: number, year: number) {
    const where: any = { userId, month, year };
    if (category) where.category = category;
    where.OR = [{ type: 'previsto' }, { type: 'saida_futura', status: 'previsto' }];

    const forecasts = await prisma.transaction.findMany({ where });

    const result = [];
    for (const f of forecasts) {
      const linked   = await prisma.transaction.findMany({ where: { linkedPreviewId: f.id } });
      const consumed = linked.reduce((s, t) => s + t.value, 0);
      const remaining = f.value - consumed;
      if (remaining > 0) result.push({ ...f, originalValue: f.value, consumed, remaining });
    }
    return result;
  }

  async listBills(userId: string, cardId: string) {
    const card = await prisma.creditCard.findFirst({ where: { id: cardId, userId } });
    if (!card) throw new AppError(404, 'Cart\u00E3o n\u00E3o encontrado');

    const bills = await prisma.transaction.groupBy({
      by: ['billMonth', 'billYear'],
      where: {
        userId, cardId,
        billMonth: { not: null }, billYear: { not: null },
        type: { not: 'pagamento_fatura' },
      },
      _sum: { value: true }, _count: true,
      orderBy: [{ billYear: 'desc' }, { billMonth: 'desc' }],
    });

    return Promise.all(bills.map(async b => {
      const payment = await prisma.transaction.findFirst({
        where: { userId, cardId, billMonth: b.billMonth!, billYear: b.billYear!, type: 'pagamento_fatura' },
      });
      return {
        billMonth: b.billMonth!, billYear: b.billYear!,
        total: b._sum.value || 0, count: b._count,
        status: payment ? 'paga' : getBillStatus(b.billMonth!, b.billYear!, card.closingDay, card.dueDay),
        dueDay: card.dueDay,
        isPaid: !!payment,
      };
    }));
  }

  async getBillDetail(userId: string, cardId: string, billMonth: number, billYear: number) {
    const card = await prisma.creditCard.findFirst({ where: { id: cardId, userId } });
    if (!card) throw new AppError(404, 'Cart\u00E3o n\u00E3o encontrado');

    const txs = await prisma.transaction.findMany({
      where: { userId, cardId, billMonth, billYear, type: { not: 'pagamento_fatura' } },
      orderBy: { date: 'desc' },
    });
    const total   = txs.reduce((s, t) => s + t.value, 0);
    const payment = await prisma.transaction.findFirst({
      where: { userId, cardId, billMonth, billYear, type: 'pagamento_fatura' },
    });

    return {
      billMonth, billYear,
      status: payment ? 'paga' : getBillStatus(billMonth, billYear, card.closingDay, card.dueDay),
      total, paid: !!payment,
      paidAt: payment?.date || null,
      paidValue: payment?.value || null,
      dueDate: `${String(card.dueDay).padStart(2, '0')}/${String(billMonth).padStart(2, '0')}/${billYear}`,
      transactions: txs,
    };
  }

  private async _checkForecastCompletion(forecastId: string, userId: string) {
    const forecast = await prisma.transaction.findUnique({ where: { id: forecastId } });
    if (!forecast) return;
    const linked   = await prisma.transaction.findMany({ where: { linkedPreviewId: forecastId } });
    const consumed = linked.reduce((s, t) => s + t.value, 0);
    const pct = forecast.value > 0 ? (consumed / forecast.value) * 100 : 0;

    if (consumed >= forecast.value) {
      await prisma.transaction.update({ where: { id: forecastId }, data: { status: 'realizado' } });
    }

    if (pct >= 80) {
      await notificationService.checkForecastDepletion(userId, forecast.description, pct);
    }
  }
}

export const transactionService = new TransactionService();
