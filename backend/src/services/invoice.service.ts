import * as fs   from 'fs';
import * as path from 'path';
import pdfParse  from 'pdf-parse';
import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';

export class InvoiceService {

  private async extractText(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
      const buf  = fs.readFileSync(filePath);
      const data = await pdfParse(buf);
      if (!data.text?.trim()) {
        return `__IMAGE__:${filePath}`;
      }
      return data.text;
    }

    if (['.csv', '.ofx', '.txt'].includes(ext)) {
      return fs.readFileSync(filePath, 'utf-8');
    }

    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      return `__IMAGE__:${filePath}`;
    }

    throw new AppError(400, `Formato n\u00E3o suportado: ${ext}`);
  }

  private async analyzeWithGemini(textOrPath: string, categories: { id: string; label: string }[]) {
  const { analyzeInvoiceWithGemini } = await import('../lib/gemini');
  const isImage = textOrPath.startsWith('__IMAGE__:');
  const actualPath = isImage ? textOrPath.replace('__IMAGE__:', '') : null;

  try {
    return await analyzeInvoiceWithGemini(
      actualPath || textOrPath,
      isImage,
      categories
    );
  } catch (err: any) {
    throw new AppError(500, `Erro ao processar fatura com IA: ${err.message}`);
  }
}

async parse(filePath: string, _mime: string, _userId: string) {
  try {
    const categories = await prisma.category.findMany({ select: { id: true, label: true } });
    const text = await this.extractText(filePath);
    const result = await this.analyzeWithGemini(text, categories);
    
    if (!result.transactions || result.transactions.length === 0) {
      throw new AppError(400, 'Nenhuma transação encontrada no arquivo.');
    }
    return result;
  } finally {
    fs.unlink(filePath, () => {});
  }
}

  async importTransactions(
    userId: string,
    cardId: string,
    transactions: any[],
    forceBillMonth?: number,
    forceBillYear?: number,
  ) {
    const card = await prisma.creditCard.findFirst({ where: { id: cardId, userId } });
    if (!card) throw new AppError(404, 'Cart\u00E3o n\u00E3o encontrado');

    const created = [];
    const skipped: { description: string; reason: string }[] = [];

    for (const tx of transactions) {
      const dateObj = new Date(tx.date + 'T12:00:00');
      const month   = dateObj.getMonth() + 1;
      const year    = dateObj.getFullYear();
      const day     = dateObj.getDate();

      // Se um mês de fatura foi informado explicitamente (importação de fatura específica),
      // usa ele diretamente — evita que transações próximas ao fechamento caiam no mês errado
      let billMonth: number;
      let billYear: number;
      if (forceBillMonth && forceBillYear) {
        billMonth = forceBillMonth;
        billYear  = forceBillYear;
      } else {
        billMonth = month;
        billYear  = year;
        if (day > card.closingDay) {
          billMonth += 1;
          if (billMonth > 12) { billMonth = 1; billYear += 1; }
        }
      }

      // ── Validação de duplicidade: janela de ±2 dias ──────────────────────
      const dupFrom = new Date(dateObj.getTime() - 2 * 86400000);
      const dupTo   = new Date(dateObj.getTime() + 2 * 86400000);
      const duplicate = await prisma.transaction.findFirst({
        where: {
          userId,
          cardId,
          description: String(tx.description).toUpperCase(),
          value: Number(tx.value),
          date: { gte: dupFrom, lte: dupTo },
        },
      });
      if (duplicate) {
        skipped.push({ description: tx.description, reason: 'Duplicado (já lançado anteriormente)' });
        continue;
      }
      // ────────────────────────────────────────────────────────────────────

      const t = await prisma.transaction.create({
        data: {
          userId,
          type: 'saida',
          description: String(tx.description).toUpperCase(),
          category: tx.categoryId || 'outros',
          value: Number(tx.value),
          date: dateObj,
          paymentMethod: 'credito',
          cardId,
          status: 'realizado',
          recurring: false,
          month, year, billMonth, billYear,
        },
      });
      created.push(t);
    }

    // [A-03] FIX: só incrementar 'used' se a fatura não está marcada como paga.
    // Importar faturas antigas já pagas não deve reduzir o limite disponível do cartão.
    const isBillAlreadyPaid = !!(forceBillMonth && forceBillYear &&
      await prisma.transaction.findFirst({
        where: { userId, cardId, billMonth: forceBillMonth, billYear: forceBillYear, type: 'pagamento_fatura' },
      })
    );

    const totalImported = created.reduce((s, t) => s + Number(t.value), 0);
    if (totalImported > 0 && !isBillAlreadyPaid) {
      await prisma.creditCard.update({
        where: { id: cardId },
        data: { used: { increment: totalImported } },
      });
    }

    return {
      imported: created.length,
      skipped: skipped.length,
      skippedItems: skipped,
      total: totalImported,
      transactions: created,
    };
  }
}

export const invoiceService = new InvoiceService();
