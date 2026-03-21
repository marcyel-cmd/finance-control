import { z } from 'zod';

export const createCategorySchema = z.object({
  id:    z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, 'Apenas letras min\u00FAsculas, n\u00FAmeros e underscore'),
  label: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon:  z.string().min(1).max(10),
});

export const updateCategorySchema = z.object({
  label: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon:  z.string().min(1).max(10).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
