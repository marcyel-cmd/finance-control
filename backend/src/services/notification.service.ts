import { prisma } from '../lib/prisma';

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
    return prisma.notification.create({
      data: {
        userId, type: data.type, title: data.title,
        message: data.message, date: new Date(), icon: data.icon,
        actionLabel: data.actionLabel, actionRoute: data.actionRoute,
        relatedAmount: data.relatedAmount,
      },
    });
  }

  // ── Triggers autom\u00E1ticos ────────────────────────────────

  async checkCardLimit(userId: string, card: any) {
    const pct = card.limit > 0 ? (card.used / card.limit) * 100 : 0;

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
    } else if (pct >= 80) {
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
}

export const notificationService = new NotificationService();
