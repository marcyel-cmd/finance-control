import { prisma } from '../lib/prisma';
import { sendPush, isPushConfigured, PushPayload } from '../lib/webPush';

export class PushSubscriptionService {

  async list(userId: string) {
    return prisma.pushSubscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, endpoint: true, deviceName: true, createdAt: true, lastUsedAt: true },
    });
  }

  async subscribe(userId: string, data: {
    endpoint: string; p256dh: string; auth: string; deviceName?: string;
  }) {
    // upsert por endpoint — mesmo dispositivo recadastrando não duplica
    return prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId,
        endpoint:   data.endpoint,
        p256dh:     data.p256dh,
        auth:       data.auth,
        deviceName: data.deviceName ?? null,
      },
      update: {
        userId,
        p256dh:     data.p256dh,
        auth:       data.auth,
        deviceName: data.deviceName ?? null,
      },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { deleted: true };
  }

  async unsubscribeById(userId: string, id: string) {
    await prisma.pushSubscription.deleteMany({ where: { userId, id } });
    return { deleted: true };
  }

  // Envia o mesmo payload pra todas subscriptions do usuário em paralelo.
  // Remove subscriptions inválidas (404/410) automaticamente.
  async sendToUser(userId: string, payload: PushPayload) {
    if (!isPushConfigured) return { sent: 0, removed: 0, skipped: true };

    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) return { sent: 0, removed: 0, skipped: false };

    let sent = 0;
    let removed = 0;

    await Promise.all(subs.map(async (s) => {
      const result = await sendPush(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      if (result.ok) {
        sent++;
        await prisma.pushSubscription.update({
          where: { id: s.id },
          data: { lastUsedAt: new Date() },
        }).catch(() => null);
      } else if (result.statusCode === 404 || result.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => null);
        removed++;
      }
    }));

    return { sent, removed, skipped: false };
  }
}

export const pushSubscriptionService = new PushSubscriptionService();
