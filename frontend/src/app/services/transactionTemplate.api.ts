// src/app/services/transactionTemplate.api.ts
import { apiFetch } from './api';

export type TemplateType = 'entrada' | 'saida';

export interface TransactionTemplate {
  id: string;
  label: string;
  type: TemplateType;
  defaultValue: number | null;
  valueRequired: boolean;
  category: string;
  paymentMethod: string;
  cardId: string | null;
  icon: string | null;
  color: string | null;
  useCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
  card?: { id: string; name: string; lastDigits: string; color: string; brand: string } | null;
}

export interface CreateTransactionTemplateInput {
  label: string;
  type: TemplateType;
  defaultValue?: number | null;
  valueRequired?: boolean;
  category: string;
  paymentMethod: string;
  cardId?: string | null;
  icon?: string | null;
  color?: string | null;
}

export const transactionTemplateApi = {
  async list() {
    return apiFetch<{ success: boolean; data: TransactionTemplate[] }>('/transaction-templates');
  },

  async listTop(limit = 6) {
    return apiFetch<{ success: boolean; data: TransactionTemplate[] }>(`/transaction-templates?top=1&limit=${limit}`);
  },

  async create(data: CreateTransactionTemplateInput) {
    return apiFetch<{ success: boolean; data: TransactionTemplate }>('/transaction-templates', { method: 'POST', body: data });
  },

  async update(id: string, data: Partial<CreateTransactionTemplateInput>) {
    return apiFetch<{ success: boolean; data: TransactionTemplate }>(`/transaction-templates/${id}`, { method: 'PUT', body: data });
  },

  async delete(id: string) {
    return apiFetch(`/transaction-templates/${id}`, { method: 'DELETE' });
  },

  async use(id: string, value?: number) {
    return apiFetch<{ success: boolean; data: { transaction: any; templateId: string } }>(
      `/transaction-templates/${id}/use`,
      { method: 'POST', body: value !== undefined ? { value } : {} },
    );
  },
};
