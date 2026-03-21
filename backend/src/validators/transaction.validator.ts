import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['entrada', 'saida', 'saida_futura', 'previsto']),
  description: z.string().min(1).max(200),
  category: z.string().min(1),
  value: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.string().min(1),
  cardId: z.string().uuid().optional().nullable(),
  status: z.enum(['realizado', 'previsto']).default('realizado'),
  recurring: z.boolean().default(false),
  linkedPreviewId: z.string().uuid().optional().nullable(),
  installment: z.boolean().default(false),
  installmentTotal: z.number().int().min(2).max(48).optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionQuerySchema = z.object({
  month:     z.coerce.number().int().min(1).max(12).optional(),
  year:      z.coerce.number().int().min(2020).max(2100).optional(),
  type:      z.enum(['entrada', 'saida', 'saida_futura', 'previsto']).optional(),
  category:  z.string().optional(),
  status:    z.enum(['realizado', 'previsto']).optional(),
  search:    z.string().optional(),
  cardId:    z.string().optional(),
  billMonth: z.coerce.number().int().min(1).max(12).optional(),
  billYear:  z.coerce.number().int().min(2020).max(2100).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQuery       = z.infer<typeof transactionQuerySchema>;
