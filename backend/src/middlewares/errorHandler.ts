import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }
  if (err instanceof ZodError) {
    const messages = err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return res.status(400).json({ success: false, error: messages });
  }
  console.error('[ERROR]', err);
  return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
}
