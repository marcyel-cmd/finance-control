import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export function adminMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new AppError(401, 'Autenticação necessária');
  }
  if (req.user.role !== 'admin') {
    throw new AppError(403, 'Acesso restrito a administradores');
  }
  next();
}
