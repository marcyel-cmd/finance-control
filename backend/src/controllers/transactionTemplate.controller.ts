import { Request, Response, NextFunction } from 'express';
import { transactionTemplateService } from '../services/transactionTemplate.service';
import {
  createTransactionTemplateSchema,
  updateTransactionTemplateSchema,
  useTemplateSchema,
} from '../validators/transactionTemplate.validator';

export class TransactionTemplateController {

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const top = req.query.top !== undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const result = top
        ? await transactionTemplateService.listTop(req.user!.userId, limit ?? 6)
        : await transactionTemplateService.list(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionTemplateService.findById(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTransactionTemplateSchema.parse(req.body);
      const result = await transactionTemplateService.create(req.user!.userId, data);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateTransactionTemplateSchema.parse(req.body);
      const result = await transactionTemplateService.update(req.user!.userId, req.params.id as string, data);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await transactionTemplateService.delete(req.user!.userId, req.params.id as string);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const data = useTemplateSchema.parse(req.body);
      const result = await transactionTemplateService.use(req.user!.userId, req.params.id as string, data.value);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const transactionTemplateController = new TransactionTemplateController();
