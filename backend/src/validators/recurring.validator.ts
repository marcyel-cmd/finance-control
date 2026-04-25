import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD');

export const createRecurringSchema = z.object({
  type:          z.enum(['entrada', 'saida']),
  description:   z.string().min(1).max(200),
  category:      z.string().min(1),
  value:         z.number().positive(),
  paymentMethod: z.string().min(1),
  cardId:        z.string().uuid().nullable().optional(),

  frequency:     z.enum(['monthly', 'weekly', 'daily']),
  dayOfMonth:    z.number().int().min(1).max(31).nullable().optional(),
  weekday:       z.number().int().min(0).max(6).nullable().optional(),

  startDate:     dateString,
  endDate:       dateString.nullable().optional(),

  active:        z.boolean().optional(),
}).refine(
  (data) => data.frequency !== 'monthly' || data.dayOfMonth != null,
  { message: 'dayOfMonth é obrigatório quando frequency = monthly', path: ['dayOfMonth'] },
).refine(
  (data) => data.frequency !== 'weekly' || data.weekday != null,
  { message: 'weekday é obrigatório quando frequency = weekly', path: ['weekday'] },
);

export const updateRecurringSchema = z.object({
  type:          z.enum(['entrada', 'saida']).optional(),
  description:   z.string().min(1).max(200).optional(),
  category:      z.string().min(1).optional(),
  value:         z.number().positive().optional(),
  paymentMethod: z.string().min(1).optional(),
  cardId:        z.string().uuid().nullable().optional(),

  frequency:     z.enum(['monthly', 'weekly', 'daily']).optional(),
  dayOfMonth:    z.number().int().min(1).max(31).nullable().optional(),
  weekday:       z.number().int().min(0).max(6).nullable().optional(),

  startDate:     dateString.optional(),
  endDate:       dateString.nullable().optional(),

  active:        z.boolean().optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
