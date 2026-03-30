// src/app/services/invoice.api.ts
import { apiFetch, apiUpload } from './api';

export interface ParsedTransaction {
  description: string;
  value: number;
  date: string;
  categoryId: string;
  confidence: number;
  originalText?: string;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  summary: {
    total: number;
    count: number;
    dateRange: { from: string; to: string };
  };
}

export const invoiceApi = {
  async parse(file: File, cardId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('cardId', cardId);
    return apiUpload<{ success: boolean; data: ParseResult }>('/invoice/parse', formData);
  },

  async importTransactions(
    cardId: string,
    transactions: Array<{ description: string; value: number; date: string; categoryId: string }>,
    billMonth?: number,
    billYear?: number,
  ) {
    return apiFetch<{ success: boolean; data: { imported: number; total: number } }>(
      '/invoice/import',
      { method: 'POST', body: { cardId, transactions, billMonth, billYear } }
    );
  },
};
