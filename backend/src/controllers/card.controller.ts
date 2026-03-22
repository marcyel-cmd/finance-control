import { Request, Response, NextFunction } from 'express';
import { cardService } from '../services/card.service';
import { createCardSchema, updateCardSchema } from '../validators/card.validator';

export class CardController {

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cardService.list(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cardService.findById(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year  = req.query.year  ? Number(req.query.year)  : undefined;
      const result = await cardService.getTransactions(req.user!.userId, req.params.id as string, month, year);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCardSchema.parse(req.body);
      const result = await cardService.create(req.user!.userId, data);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCardSchema.parse(req.body);
      const result = await cardService.update(req.user!.userId, req.params.id as string, data);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await cardService.delete(req.user!.userId, req.params.id as string);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async payBill(req: Request, res: Response, next: NextFunction) {
    try {
      const { billMonth, billYear } = req.body;
      if (!billMonth || !billYear) {
        return res.status(400).json({ success: false, error: 'billMonth e billYear s\u00E3o obrigat\u00F3rios' });
      }
      const result = await cardService.payBill(req.user!.userId, req.params.id as string, Number(billMonth), Number(billYear));
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const cardController = new CardController();
