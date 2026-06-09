import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { pushSubscriptionService } from './pushSubscription.service';
import { pushTokenService } from './pushToken.service';
import { computeCurrentDueDate, billCycleStart } from '../lib/billing';

const BRL = (v: number) =>
  `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDate(d: Date) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

export class NotificationService {

  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({ where: { userId, read: false } });
    return { count };
  }

  async markRead(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new AppError(404, 'Notificação não encontrada');
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    const { count } = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { updated: count };
  }

  async markActionDone(userId: string, id: string) {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new AppError(404, 'Notificação não encontrada');
    return prisma.notification.update({
      where: { id },
      data: { actionDone: true },
    });
  }

  async delete(userId: string, id: string) {
    await prisma.notification.deleteMany({ where: { id, userId } });
    return { deleted: true };
  }

  async deleteAllRead(userId: string) {
    const { count } = await prisma.notification.deleteMany({ where: { userId, read: true } });
    return { deleted: count };
  }

  async create(userId: string, data: {
    type: string; title: string; message: string; icon: string;
    actionLabel?: string; actionRoute?: string; relatedAmount?: number;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId, type: data.type, title: data.title,
        message: data.message, date: new Date(), icon: data.icon,
        actionLabel: data.actionLabel, actionRoute: data.actionRoute,
        relatedAmount: data.relatedAmount,
      },
    });

    // Dispara push em paralelo. Falha silenciosa — push é best-effort,
    // a notificação in-app é o canal principal.
    // Web Push (VAPID) — navegadores / PWA
    pushSubscriptionService.sendToUser(userId, {
      title: data.title,
      body:  data.message,
      url:   data.actionRoute || '/',
      tag:   `notif_${notification.id}`,
      data:  { notificationId: notification.id, type: data.type },
    }).catch(err => console.warn('[push] erro ao enviar:', err.message));

    // Push nativo (FCM/APNs) — app mobile via Capacitor
    pushTokenService.sendToUser(userId, data.title, data.message, {
      notificationId: notification.id,
      type: data.type,
      route: data.actionRoute || '/',
    }).catch(err => console.warn('[push-native] erro ao enviar:', err.message));

    return notification;
  }

  // ── Triggers autom\u00E1ticos ────────────────────────────────

  async checkCardLimit(userId: string, card: any) {
    const pct = Number(card.limit) > 0 ? (Number(card.used) / Number(card.limit)) * 100 : 0;

    if (pct < 80) return;

    // [NOTIF-01] FIX: deduplicação — evita criar múltiplas notificações do mesmo tipo
    // para o mesmo cartão no mesmo dia (era criado a cada transação acima de 80%)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const alreadyNotified = await prisma.notification.findFirst({
      where: {
        userId,
        actionRoute: '/cartoes',
        createdAt: { gte: startOfDay },
        message: { contains: card.name },
      },
    });
    if (alreadyNotified) return;

    if (pct >= 95) {
      await this.create(userId, {
        type: 'alert',
        title: 'Limite cr\u00EDtico!',
        message: `${card.name} est\u00E1 com ${pct.toFixed(0)}% do limite utilizado.`,
        icon: '\u{1F6A8}',
        relatedAmount: card.used,
        actionLabel: 'Ver Cart\u00E3o',
        actionRoute: '/cartoes',
      });
    } else {
      await this.create(userId, {
        type: 'warning',
        title: 'Limite alto',
        message: `${card.name} atingiu ${pct.toFixed(0)}% do limite.`,
        icon: '\u26A0\uFE0F',
        relatedAmount: card.used,
        actionLabel: 'Ver Cart\u00E3o',
        actionRoute: '/cartoes',
      });
    }
  }

  async checkForecastDepletion(userId: string, forecastDesc: string, pct: number) {
    if (pct >= 80) {
      await this.create(userId, {
        type: 'warning',
        title: 'Or\u00E7amento quase esgotado',
        message: `"${forecastDesc}" est\u00E1 com ${pct.toFixed(0)}% utilizado.`,
        icon: '\u{1F4CA}',
        actionLabel: 'Ver Transa\u00E7\u00F5es',
        actionRoute: '/transacoes',
      });
    }
  }

  // \u2500\u2500 Helpers de deduplica\u00E7\u00E3o (padr\u00E3o checkCardLimit) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

  private async _exists(userId: string, opts: { since: Date; contains: string[]; title?: string }) {
    return prisma.notification.findFirst({
      where: {
        userId,
        createdAt: { gte: opts.since },
        ...(opts.title ? { title: opts.title } : {}),
        AND: opts.contains.map(c => ({ message: { contains: c } })),
      },
    });
  }

  // \u2500\u2500 Gatilho 2 \u2014 Resumo Di\u00E1rio de Gastos \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Roda no job di\u00E1rio (06:00 boot + 20:00). Para cada usu\u00E1rio ativo, resume
  // os gastos realizados de HOJE. Dedup: 1 resumo por usu\u00E1rio por dia.
  async sendDailyExpenseSummary() {
    const since = startOfToday();
    const tomorrow = new Date(since.getTime() + 86_400_000);

    const users = await prisma.user.findMany({ where: { active: true }, select: { id: true } });
    const categories = await prisma.category.findMany({ select: { id: true, label: true } });
    const catLabel = new Map(categories.map(c => [c.id, c.label]));

    for (const u of users) {
      const txs = await prisma.transaction.findMany({
        where: {
          userId: u.id,
          type: { in: ['saida', 'saida_futura'] },
          status: 'realizado',
          date: { gte: since, lt: tomorrow },
        },
      });
      if (txs.length === 0) continue;

      // Dedup: j\u00E1 enviou resumo hoje?
      const already = await this._exists(u.id, { since, contains: [], title: 'Resumo do dia' });
      if (already) continue;

      const total = txs.reduce((s, t) => s + Number(t.value), 0);

      const byCategory = new Map<string, number>();
      for (const t of txs) {
        byCategory.set(t.category, (byCategory.get(t.category) || 0) + Number(t.value));
      }
      let topCat = ''; let topVal = 0;
      for (const [cat, val] of byCategory) {
        if (val > topVal) { topVal = val; topCat = cat; }
      }
      const topLabel = catLabel.get(topCat) || topCat;

      const plural = txs.length === 1 ? 'lan\u00E7amento' : 'lan\u00E7amentos';
      await this.create(u.id, {
        type: 'info',
        title: 'Resumo do dia',
        message: `Voc\u00EA gastou ${BRL(total)} em ${txs.length} ${plural} hoje. Maior gasto: ${topLabel} (${BRL(topVal)}).`,
        icon: '\u{1F4CA}',
        relatedAmount: total,
        actionLabel: 'Ver An\u00E1lises',
        actionRoute: '/analises',
      });
    }
  }

  // \u2500\u2500 Gatilho 3 \u2014 Lan\u00E7amentos Previstos \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Avisa sobre previstos que vencem amanh\u00E3. Valores > R$ 500 avisam com 3 dias
  // de anteced\u00EAncia. Dedup por lan\u00E7amento + dia de cria\u00E7\u00E3o da notifica\u00E7\u00E3o.
  async notifyUpcomingForecasts() {
    const since = startOfToday();
    const horizon = new Date(since.getTime() + 4 * 86_400_000); // hoje + 4 dias (exclusivo)

    const previstos = await prisma.transaction.findMany({
      where: {
        status: 'previsto',
        date: { gte: since, lt: horizon },
      },
    });

    for (const tx of previstos) {
      const d = new Date(tx.date);
      const dueOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const days = Math.round((dueOnly.getTime() - since.getTime()) / 86_400_000);
      const value = Number(tx.value);

      const isTomorrow = days === 1;
      const isHighValueAdvance = value > 500 && days === 3;
      if (!isTomorrow && !isHighValueAdvance) continue;

      const title = isTomorrow ? 'Lan\u00E7amento previsto amanh\u00E3' : 'Lan\u00E7amento previsto em 3 dias';
      const dateStr = fmtDate(d);

      // Dedup: mesma transa\u00E7\u00E3o + mesmo t\u00EDtulo no dia de hoje
      const already = await this._exists(tx.userId, { since, contains: [tx.description, dateStr], title });
      if (already) continue;

      await this.create(tx.userId, {
        type: 'info',
        title,
        message: `${tx.description} \u2014 ${BRL(value)} em ${dateStr}.`,
        icon: '\u{1F4C5}',
        relatedAmount: value,
        actionLabel: 'Ver Transa\u00E7\u00F5es',
        actionRoute: '/transacoes',
      });
    }
  }

  // \u2500\u2500 Gatilho 4 \u2014 Vencimentos de Cart\u00E3o \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Avisa quando a fatura vence em 5 dias (antecipado) e em 1 dia (urgente).
  // Dedup: no m\u00E1ximo um aviso de cada tipo por cart\u00E3o por ciclo de fatura.
  async notifyCardDueDates() {
    const today = startOfToday();

    // Apenas cart\u00F5es de usu\u00E1rios ativos
    const cards = await prisma.creditCard.findMany({
      where: { user: { active: true } },
    });

    for (const card of cards) {
      const dueDate = computeCurrentDueDate(card.closingDay, card.dueDay, today);
      const days = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);
      const dateStr = fmtDate(dueDate);
      // Janela de dedup: desde o in\u00EDcio do ciclo atual
      const since = billCycleStart(dueDate, card.closingDay);

      if (days === 5) {
        const already = await this._exists(card.userId, {
          since, contains: [card.name, dateStr], title: 'Fatura vence em 5 dias',
        });
        if (already) continue;
        await this.create(card.userId, {
          type: 'info',
          title: 'Fatura vence em 5 dias',
          message: `\u{1F4C5} A fatura do ${card.name} vence em ${dateStr}.`,
          icon: '\u{1F4C5}',
          actionLabel: 'Ver Cart\u00F5es',
          actionRoute: '/cartoes',
        });
      } else if (days === 1) {
        const already = await this._exists(card.userId, {
          since, contains: [card.name, dateStr], title: 'Fatura vence amanh\u00E3!',
        });
        if (already) continue;
        await this.create(card.userId, {
          type: 'alert',
          title: 'Fatura vence amanh\u00E3!',
          message: `\u{1F514} N\u00E3o esque\u00E7a: a fatura do ${card.name} vence amanh\u00E3 (${dateStr}).`,
          icon: '\u{1F514}',
          actionLabel: 'Ver Cart\u00F5es',
          actionRoute: '/cartoes',
        });
      }
    }
  }
}

export const notificationService = new NotificationService();
