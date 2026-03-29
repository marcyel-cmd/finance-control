// src/app/services/transactions.api.ts
import { apiFetch } from './api';
import { Transaction } from '../types';

export const transactionsApi = {
  async list(params: {
    month?: number; year?: number; type?: string; category?: string;
    status?: string; search?: string; cardId?: string;
    billMonth?: number; billYear?: number;
  } = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
    });
    const qs = query.toString();
    return apiFetch<{ success: boolean; data: Transaction[]; meta: { count: number } }>(
      `/transactions${qs ? `?${qs}` : ''}`
    );
  },

  async summary(month: number, year: number) {
    return apiFetch<{
      success: boolean; data: {
        entradas: number; saidas: number; saldo: number;
        economia: number; previsto: number; total: number;
      };
    }>(`/transactions/summary?month=${month}&year=${year}`);
  },

  async forecasts(month: number, year: number, category?: string) {
    const catParam = category ? `&category=${category}` : '';
    return apiFetch(`/transactions/forecasts?month=${month}&year=${year}${catParam}`);
  },

  async getById(id: string) {
    return apiFetch(`/transactions/${id}`);
  },

  async create(data: {
    type: string; description: string; category: string; value: number;
    date: string; paymentMethod: string; cardId?: string | null;
    status?: string; recurring?: boolean; linkedPreviewId?: string | null;
    installment?: boolean; installmentTotal?: number | null;
  }) {
    return apiFetch('/transactions', { method: 'POST', body: data });
  },

  async update(id: string, data: Partial<Transaction>) {
    return apiFetch(`/transactions/${id}`, { method: 'PUT', body: data });
  },

  async delete(id: string) {
    return apiFetch(`/transactions/${id}`, { method: 'DELETE' });
  },

  // Faturas
  async listBills(cardId: string) {
    return apiFetch(`/transactions/bills/${cardId}`);
  },

  async getBillDetail(cardId: string, month: number, year: number) {
    return apiFetch(`/transactions/bills/${cardId}/detail?month=${month}&year=${year}`);
  },

  // Rolagem de saldo: lança "Saldo em Conta" do mês anterior
  async carryForward(month: number, year: number) {
    return apiFetch(`/transactions/carry-forward?month=${month}&year=${year}`, { method: 'POST' });
  },
};
