// src/app/services/push.api.ts
import { apiFetch } from './api';

export const pushApi = {
  async getVapidPublicKey() {
    return apiFetch<{ success: boolean; data: { publicKey: string; configured: boolean } }>(
      '/push/vapid-public-key',
    );
  },

  async listSubscriptions() {
    return apiFetch<{ success: boolean; data: Array<{ id: string; endpoint: string; deviceName: string | null; createdAt: string; lastUsedAt: string | null }> }>(
      '/push',
    );
  },

  async subscribe(data: { endpoint: string; p256dh: string; auth: string; deviceName?: string }) {
    return apiFetch<{ success: boolean; data: { id: string; endpoint: string } }>(
      '/push/subscribe',
      { method: 'POST', body: data },
    );
  },

  async unsubscribe(endpoint: string) {
    return apiFetch('/push/unsubscribe', { method: 'POST', body: { endpoint } });
  },

  async test() {
    return apiFetch<{ success: boolean; data: { sent: number; removed: number; skipped: boolean } }>(
      '/push/test',
      { method: 'POST' },
    );
  },
};
