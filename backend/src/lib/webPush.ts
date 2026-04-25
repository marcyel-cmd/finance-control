import webpush from 'web-push';

const PUBLIC  = process.env.VAPID_PUBLIC_KEY  || '';
const PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const SUBJECT = process.env.VAPID_SUBJECT     || 'mailto:noreply@example.com';

export const isPushConfigured = !!(PUBLIC && PRIVATE);

if (isPushConfigured) {
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
} else {
  console.warn('[push] VAPID keys ausentes — Web Push desativado. Rode `npx web-push generate-vapid-keys` e preencha .env');
}

export const VAPID_PUBLIC_KEY = PUBLIC;

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

export async function sendPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: PushPayload,
) {
  if (!isPushConfigured) return { ok: false, reason: 'not_configured' as const };
  try {
    const res = await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { ok: true as const, statusCode: res.statusCode };
  } catch (err: any) {
    // 404 ou 410 = subscription expirou e o caller deve removê-la
    return { ok: false as const, statusCode: err.statusCode, reason: 'send_failed' as const, message: err.message };
  }
}
