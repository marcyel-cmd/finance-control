// src/app/services/smartImport.api.ts
import { apiUpload, apiFetch } from './api';

export interface SmartImportTransaction {
  description: string;
  value: number;
  date: string;
  type: 'entrada' | 'saida';
  categoryId: string;
  paymentMethodGuess?: string;
  isInstallment: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
  confidence: number;
  originalText: string;
  duplicateStatus: 'new' | 'duplicate' | 'possible_duplicate';
  duplicateConfidence: number;
  duplicateReason: string;
  existingTransactionId?: string;
}

export interface SmartImportParseResult {
  transactions: SmartImportTransaction[];
  summary: {
    total: number;
    new: number;
    duplicates: number;
    possibleDuplicates: number;
    totalEntradas: number;
    totalSaidas: number;
    dateRange: { from: string; to: string };
  };
}

export interface SmartImportSavePayload {
  description: string;
  value: number;
  date: string;
  type: 'entrada' | 'saida';
  categoryId: string;
  paymentMethod?: string;
  cardId?: string;
  isInstallment: boolean;
  currentInstallment?: number;
  totalInstallments?: number;
  status?: string;
}

export interface SmartImportSaveResult {
  imported: number;
  skipped: number;
  transactions: any[];
}

export const smartImportApi = {
  async parse(files: File[]): Promise<{ success: boolean; data: SmartImportParseResult }> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    return apiUpload<{ success: boolean; data: SmartImportParseResult }>('/smart-import/parse', formData);
  },

  async save(transactions: SmartImportSavePayload[]): Promise<{ success: boolean; data: SmartImportSaveResult }> {
    return apiFetch<{ success: boolean; data: SmartImportSaveResult }>('/smart-import/save', {
      method: 'POST',
      body: { transactions },
    });
  },
};
