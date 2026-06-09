// src/app/services/notifications.api.ts
import { apiFetch } from './api';
import { AppNotification } from '../types';

export const notificationsApi = {
  async list() {
    return apiFetch<{
      success: boolean;
      data: AppNotification[];
      meta: { count: number; unreadCount: number };
    }>('/notifications');
  },

  async getUnreadCount() {
    return apiFetch<{ success: boolean; data: { count: number } }>('/notifications/unread-count');
  },

  async markRead(id: string) {
    return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllRead() {
    return apiFetch('/notifications/read-all', { method: 'PATCH' });
  },

  async markActionDone(id: string) {
    return apiFetch(`/notifications/${id}/action`, { method: 'PATCH' });
  },

  async delete(id: string) {
    return apiFetch(`/notifications/${id}`, { method: 'DELETE' });
  },

  async deleteAllRead() {
    return apiFetch('/notifications/read', { method: 'DELETE' });
  },

  // Registra o token de push nativo (FCM/APNs) do dispositivo no backend.
  async registerPushToken(token: string, platform: 'ios' | 'android') {
    return apiFetch('/notifications/push-token', {
      method: 'POST',
      body: { token, platform },
    });
  },
};
