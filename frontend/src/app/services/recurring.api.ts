// src/app/services/recurring.api.ts
import { apiFetch } from './api';

export type RecurringFrequency = 'monthly' | 'weekly' | 'daily';
export type RecurringType = 'entrada' | 'saida';

export interface RecurringTemplate {
  id: string;
  type: RecurringType;
  description: string;
  category: string;
  value: number;
  paymentMethod: string;
  cardId: string | null;
  frequency: RecurringFrequency;
  dayOfMonth: number | null;
  weekday: number | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  lastGeneratedAt: string | null;
  createdAt: string;
  updatedAt: string;
  card?: { id: string; name: string; lastDigits: string; color: string; brand: string } | null;
}

export interface CreateRecurringInput {
  type: RecurringType;
  description: string;
  category: string;
  value: number;
  paymentMethod: string;
  cardId?: string | null;
  frequency: RecurringFrequency;
  dayOfMonth?: number | null;
  weekday?: number | null;
  startDate: string;
  endDate?: string | null;
  active?: boolean;
}

export const recurringApi = {
  async list() {
    return apiFetch<{ success: boolean; data: RecurringTemplate[] }>('/recurring');
  },

  async create(data: CreateRecurringInput) {
    return apiFetch<{ success: boolean; data: RecurringTemplate }>('/recurring', { method: 'POST', body: data });
  },

  async update(id: string, data: Partial<CreateRecurringInput>) {
    return apiFetch<{ success: boolean; data: RecurringTemplate }>(`/recurring/${id}`, { method: 'PUT', body: data });
  },

  async delete(id: string) {
    return apiFetch(`/recurring/${id}`, { method: 'DELETE' });
  },

  async runNow() {
    return apiFetch<{ success: boolean; data: { templates: number; transactionsCreated: number } }>('/recurring/run-now', { method: 'POST' });
  },
};
