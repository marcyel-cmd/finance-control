import { Request, Response, NextFunction } from 'express';
import { recurringService } from '../services/recurring.service';
import { createRecurringSchema, updateRecurringSchema } from '../validators/recurring.validator';

export class RecurringController {

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recurringService.list(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recurringService.findById(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createRecurringSchema.parse(req.body);
      const result = await recurringService.create(req.user!.userId, data);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateRecurringSchema.parse(req.body);
      const result = await recurringService.update(req.user!.userId, req.params.id as string, data);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recurringService.delete(req.user!.userId, req.params.id as string);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  // Dispara o job manualmente pro usuário autenticado — útil pra testar ou
  // forçar uma execução fora do horário do cron.
  async runNow(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await recurringService.generateDueTransactions(new Date(), req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const recurringController = new RecurringController();
