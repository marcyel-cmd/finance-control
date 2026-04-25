import { z } from 'zod';

export const createTransactionTemplateSchema = z.object({
  label:         z.string().min(1).max(40),
  type:          z.enum(['entrada', 'saida']),
  defaultValue:  z.number().positive().nullable().optional(),
  valueRequired: z.boolean().optional(),
  category:      z.string().min(1),
  paymentMethod: z.string().min(1),
  cardId:        z.string().uuid().nullable().optional(),
  icon:          z.string().max(8).nullable().optional(),
  color:         z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
});

export const updateTransactionTemplateSchema = createTransactionTemplateSchema.partial();

// Body do endpoint POST /transaction-templates/:id/use
export const useTemplateSchema = z.object({
  value: z.number().positive().optional(), // só obrigatório se template.valueRequired=true (validado no service)
});

export type CreateTransactionTemplateInput = z.infer<typeof createTransactionTemplateSchema>;
export type UpdateTransactionTemplateInput = z.infer<typeof updateTransactionTemplateSchema>;
