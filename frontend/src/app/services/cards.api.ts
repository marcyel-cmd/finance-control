// src/app/services/cards.api.ts
import { apiFetch } from './api';
import { CreditCard } from '../types';

export const cardsApi = {
  async list() {
    return apiFetch<{ success: boolean; data: CreditCard[] }>('/cards');
  },

  async getById(id: string) {
    return apiFetch<{ success: boolean; data: CreditCard }>(`/cards/${id}`);
  },

  async getTransactions(id: string, month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    const qs = params.toString();
    return apiFetch(`/cards/${id}/transactions${qs ? `?${qs}` : ''}`);
  },

  async create(data: {
    name: string; lastDigits: string; brand: string; color: string;
    limit: number; closingDay: number; dueDay: number; type: string;
  }) {
    return apiFetch<{ success: boolean; data: CreditCard }>('/cards', { method: 'POST', body: data });
  },

  async update(id: string, data: Partial<CreditCard>) {
    return apiFetch<{ success: boolean; data: CreditCard }>(`/cards/${id}`, { method: 'PUT', body: data });
  },

  async delete(id: string) {
    return apiFetch(`/cards/${id}`, { method: 'DELETE' });
  },

  async payBill(cardId: string, billMonth: number, billYear: number) {
    return apiFetch(`/cards/${cardId}/pay-bill`, {
      method: 'POST',
      body: { billMonth, billYear },
    });
  },
};
