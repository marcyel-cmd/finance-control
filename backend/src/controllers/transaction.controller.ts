import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';
import { createTransactionSchema, updateTransactionSchema, transactionQuerySchema } from '../validators/transaction.validator';

export class TransactionController {

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = transactionQuerySchema.parse(req.query);
      const result = await transactionService.list(req.user!.userId, query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async summary(req: Request, res: Response, next: NextFunction) {
    try {
      const month = Number(req.query.month);
      const year  = Number(req.query.year);
      if (!month || !year) {
        return res.status(400).json({ success: false, error: 'month e year s\u00E3o obrigat\u00F3rios' });
      }
      const result = await transactionService.summary(req.user!.userId, month, year);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async forecasts(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string || '';
      const month = Number(req.query.month);
      const year  = Number(req.query.year);
      if (!month || !year) {
        return res.status(400).json({ success: false, error: 'month e year s\u00E3o obrigat\u00F3rios' });
      }
      const result = await transactionService.getAvailableForecasts(req.user!.userId, category, month, year);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async bills(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.listBills(req.user!.userId, req.params.cardId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async billDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const month = Number(req.query.month);
      const year  = Number(req.query.year);
      if (!month || !year) {
        return res.status(400).json({ success: false, error: 'month e year s\u00E3o obrigat\u00F3rios' });
      }
      const result = await transactionService.getBillDetail(req.user!.userId, req.params.cardId, month, year);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.findById(req.user!.userId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTransactionSchema.parse(req.body);
      const result = await transactionService.create(req.user!.userId, data);
      res.status(201).json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTransactionSchema.parse(req.body);
      const result = await transactionService.update(req.user!.userId, req.params.id, data);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.delete(req.user!.userId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }
}

export const transactionController = new TransactionController();
