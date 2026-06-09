import * as fs from 'fs';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import {
  smartImportFromImages,
  checkDuplicatesWithGemini,
  SmartImportTransaction,
  DuplicateCheckItem,
} from '../lib/gemini';

export interface SmartImportParsedTransaction extends SmartImportTransaction {
  duplicateStatus: 'new' | 'duplicate' | 'possible_duplicate';
  duplicateConfidence: number;
  duplicateReason: string;
  existingTransactionId?: string;
}

export interface SmartImportParseResult {
  transactions: SmartImportParsedTransaction[];
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

export interface SmartImportSaveResult {
  imported: number;
  skipped: number;
  transactions: any[];
}

export class SmartImportService {

  /**
   * STEP 1: Parse images + detect duplicates
   * Returns transactions with duplicate status for user review
   */
  async parse(userId: string, filePaths: string[]): Promise<SmartImportParseResult> {
    try {
      // 1. Get categories for Gemini
      const categories = await prisma.category.findMany({ select: { id: true, label: true } });

      // 2. Extract transactions from images via Gemini
      const extracted = await smartImportFromImages(filePaths, categories);

      if (!extracted.transactions || extracted.transactions.length === 0) {
        throw new AppError(400, 'Nenhuma transação encontrada nas imagens.');
      }

      // 3. For each extracted transaction, find potential duplicates in DB
      const parsedTransactions: SmartImportParsedTransaction[] = [];
      const duplicateCheckItems: DuplicateCheckItem[] = [];

      for (let i = 0; i < extracted.transactions.length; i++) {
        const tx = extracted.transactions[i];
        const dateObj = new Date(tx.date + 'T12:00:00');

        // Search for potential matches: same value ±2 days window
        const windowStart = new Date(dateObj.getTime() - 3 * 86400000);
        const windowEnd = new Date(dateObj.getTime() + 3 * 86400000);

        const potentialMatches = await prisma.transaction.findMany({
          where: {
            userId,
            value: {
              gte: tx.value * 0.9,  // ±10% value tolerance for pre-filter
              lte: tx.value * 1.1,
            },
            date: {
              gte: windowStart,
              lte: windowEnd,
            },
            type: tx.type === 'entrada' ? 'entrada' : { in: ['saida', 'saida_futura'] },
          },
          select: { id: true, description: true, value: true, date: true, type: true },
        });

        if (potentialMatches.length > 0) {
          // Pick the closest match for Gemini analysis
          const bestMatch = potentialMatches.reduce((best, curr) => {
            const currDateDiff = Math.abs(new Date(curr.date).getTime() - dateObj.getTime());
            const bestDateDiff = Math.abs(new Date(best.date).getTime() - dateObj.getTime());
            const currValueDiff = Math.abs(Number(curr.value) - tx.value);
            const bestValueDiff = Math.abs(Number(best.value) - tx.value);
            return (currDateDiff + currValueDiff * 86400) < (bestDateDiff + bestValueDiff * 86400) ? curr : best;
          });

          duplicateCheckItems.push({
            index: i,
            extracted: {
              description: tx.description,
              value: tx.value,
              date: tx.date,
              type: tx.type,
            },
            existing: {
              id: bestMatch.id,
              description: bestMatch.description,
              value: Number(bestMatch.value),
              date: new Date(bestMatch.date).toISOString().split('T')[0],
              type: bestMatch.type,
            },
          });
        }
      }

      // 4. Batch duplicate check with Gemini
      let duplicateResults: Map<number, { isDuplicate: boolean; confidence: number; reason: string; existingId: string }> = new Map();

      if (duplicateCheckItems.length > 0) {
        // Process in batches of 10 to avoid token limits
        const batchSize = 10;
        for (let batch = 0; batch < duplicateCheckItems.length; batch += batchSize) {
          const batchItems = duplicateCheckItems.slice(batch, batch + batchSize);
          const results = await checkDuplicatesWithGemini(batchItems);

          for (const result of results) {
            const originalItem = batchItems[result.index];
            if (originalItem) {
              duplicateResults.set(originalItem.index, {
                isDuplicate: result.isDuplicate,
                confidence: result.confidence,
                reason: result.reason,
                existingId: originalItem.existing.id,
              });
            }
          }
        }
      }

      // 5. Build final result
      for (let i = 0; i < extracted.transactions.length; i++) {
        const tx = extracted.transactions[i];
        const dupInfo = duplicateResults.get(i);

        let duplicateStatus: 'new' | 'duplicate' | 'possible_duplicate' = 'new';
        let duplicateConfidence = 0;
        let duplicateReason = '';
        let existingTransactionId: string | undefined;

        if (dupInfo) {
          duplicateConfidence = dupInfo.confidence;
          duplicateReason = dupInfo.reason;
          existingTransactionId = dupInfo.existingId;

          if (dupInfo.isDuplicate && dupInfo.confidence >= 0.85) {
            duplicateStatus = 'duplicate';
          } else if (dupInfo.isDuplicate || dupInfo.confidence >= 0.5) {
            duplicateStatus = 'possible_duplicate';
          }
        }

        parsedTransactions.push({
          ...tx,
          duplicateStatus,
          duplicateConfidence,
          duplicateReason,
          existingTransactionId,
        });
      }

      // 6. Summary
      const newCount = parsedTransactions.filter(t => t.duplicateStatus === 'new').length;
      const dupCount = parsedTransactions.filter(t => t.duplicateStatus === 'duplicate').length;
      const possibleCount = parsedTransactions.filter(t => t.duplicateStatus === 'possible_duplicate').length;

      return {
        transactions: parsedTransactions,
        summary: {
          total: parsedTransactions.length,
          new: newCount,
          duplicates: dupCount,
          possibleDuplicates: possibleCount,
          totalEntradas: extracted.summary?.totalEntradas || 0,
          totalSaidas: extracted.summary?.totalSaidas || 0,
          dateRange: extracted.summary?.dateRange || { from: '', to: '' },
        },
      };
    } finally {
      // Clean up uploaded files
      for (const fp of filePaths) {
        fs.unlink(fp, () => {});
      }
    }
  }

  /**
   * STEP 2: Save selected transactions
   * User sends back the transactions they want to import (already reviewed)
   */
  async save(userId: string, transactions: Array<{
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
  }>): Promise<SmartImportSaveResult> {
    const created: any[] = [];
    let skipped = 0;

    for (const tx of transactions) {
      const dateObj = new Date(tx.date + 'T12:00:00');
      const month = dateObj.getMonth() + 1;
      const year = dateObj.getFullYear();

      // Calculate billMonth/billYear if it's a credit card transaction
      let billMonth: number | null = null;
      let billYear: number | null = null;

      if (tx.cardId) {
        const card = await prisma.creditCard.findFirst({ where: { id: tx.cardId, userId } });
        if (card) {
          const day = dateObj.getDate();
          billMonth = month;
          billYear = year;
          if (day > card.closingDay) {
            billMonth += 1;
            if (billMonth > 12) { billMonth = 1; billYear += 1; }
          }
        }
      }

      // Handle installments
      if (tx.isInstallment && tx.totalInstallments && tx.totalInstallments >= 2 && tx.cardId) {
        const card = await prisma.creditCard.findFirst({ where: { id: tx.cardId, userId } });
        if (!card) { skipped++; continue; }

        const startInstallment = tx.currentInstallment || 1;
        const remaining = tx.totalInstallments - startInstallment + 1;

        // Create remaining installments
        for (let i = 0; i < remaining; i++) {
          const installNum = startInstallment + i;
          let instBillMonth = (billMonth || month) + i;
          let instBillYear = billYear || year;
          while (instBillMonth > 12) { instBillMonth -= 12; instBillYear += 1; }

          const t = await prisma.transaction.create({
            data: {
              userId,
              type: 'saida',
              description: `${tx.description.toUpperCase()} (${installNum}/${tx.totalInstallments})`,
              category: tx.categoryId,
              value: tx.value,
              date: dateObj,
              paymentMethod: tx.paymentMethod || 'credito',
              cardId: tx.cardId,
              status: tx.status || 'realizado',
              recurring: false,
              month: instBillMonth,
              year: instBillYear,
              installment: true,
              installmentNumber: installNum,
              installmentTotal: tx.totalInstallments,
              totalValue: tx.value * tx.totalInstallments,
              billMonth: instBillMonth,
              billYear: instBillYear,
            },
          });
          created.push(t);
        }

        // Update card used
        if ((tx.status || 'realizado') === 'realizado') {
          const totalToAdd = tx.value * remaining;
          await prisma.creditCard.update({
            where: { id: tx.cardId },
            data: { used: { increment: totalToAdd } },
          });
        }
      } else {
        // Simple transaction
        const t = await prisma.transaction.create({
          data: {
            userId,
            type: tx.type === 'entrada' ? 'entrada' : 'saida',
            description: tx.description.toUpperCase(),
            category: tx.categoryId,
            value: tx.value,
            date: dateObj,
            paymentMethod: tx.paymentMethod || 'pix',
            cardId: tx.cardId || null,
            status: tx.status || 'realizado',
            recurring: false,
            month,
            year,
            installment: false,
            billMonth,
            billYear,
          },
        });
        created.push(t);

        // Update card used if applicable
        if (tx.cardId && tx.type === 'saida' && (tx.status || 'realizado') === 'realizado') {
          await prisma.creditCard.update({
            where: { id: tx.cardId },
            data: { used: { increment: tx.value } },
          });
        }
      }
    }

    return {
      imported: created.length,
      skipped,
      transactions: created,
    };
  }
}

export const smartImportService = new SmartImportService();
