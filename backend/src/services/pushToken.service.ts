import { prisma } from '../lib/prisma';
import { getMessaging, isFirebaseConfigured } from '../lib/firebase';

export class PushTokenService {

  async list(userId: string) {
    return prisma.pushToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Salva o token do dispositivo. Faz upsert por token (o mesmo device
  // recadastrando não duplica) e remove tokens duplicados do mesmo usuário
  // na mesma plataforma — mantém só o recém-registrado por device/plataforma.
  async save(userId: string, token: string, platform: string) {
    const saved = await prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });

    // Remove duplicados antigos do mesmo userId+platform (mantém este token)
    await prisma.pushToken.deleteMany({
      where: { userId, platform, token: { not: token } },
    });

    return saved;
  }

  async remove(userId: string, token: string) {
    await prisma.pushToken.deleteMany({ where: { userId, token } });
    return { deleted: true };
  }

  // Envia push nativo (FCM) pra todos os tokens do usuário em paralelo.
  // Remove tokens inválidos automaticamente. Best-effort: se o Firebase não
  // estiver configurado, retorna skipped sem erro.
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!isFirebaseConfigured) return { sent: 0, removed: 0, skipped: true };

    const messaging = getMessaging();
    if (!messaging) return { sent: 0, removed: 0, skipped: true };

    const tokens = await prisma.pushToken.findMany({ where: { userId } });
    if (tokens.length === 0) return { sent: 0, removed: 0, skipped: false };

    let sent = 0;
    let removed = 0;

    await Promise.all(tokens.map(async (t) => {
      try {
        await messaging.send({
          token: t.token,
          notification: { title, body },
          // FCM data só aceita strings
          data: data ? Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)]),
          ) : undefined,
          android: { priority: 'high' },
          apns: { payload: { aps: { sound: 'default' } } },
        });
        sent++;
      } catch (err: any) {
        const code = err?.errorInfo?.code || err?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          await prisma.pushToken.delete({ where: { id: t.id } }).catch(() => null);
          removed++;
        } else {
          console.warn('[push-native] erro ao enviar:', code || err?.message);
        }
      }
    }));

    return { sent, removed, skipped: false };
  }
}

export const pushTokenService = new PushTokenService();
