import { z } from 'zod';

export const createCardSchema = z.object({
  name:       z.string().min(1).max(50),
  lastDigits: z.string().length(4).regex(/^\d{4}$/),
  brand:      z.enum(['nubank', 'picpay', 'visa', 'mastercard', 'elo', 'other']),
  color:      z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  limit:      z.number().min(0),
  closingDay: z.number().int().min(1).max(31),
  dueDay:     z.number().int().min(1).max(31),
  type:       z.enum(['credito', 'debito']),
});

export const updateCardSchema = createCardSchema.partial();

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
