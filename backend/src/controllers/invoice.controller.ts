import { Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoice.service';

export class InvoiceController {

  async parse(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Arquivo n\u00E3o enviado' });
      }
      const result = await invoiceService.parse(req.file.path, req.file.mimetype, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async import(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactions, cardId } = req.body;
      if (!transactions?.length || !cardId) {
        return res.status(400).json({ success: false, error: 'transactions e cardId s\u00E3o obrigat\u00F3rios' });
      }
      const result = await invoiceService.importTransactions(req.user!.userId, cardId, transactions);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const invoiceController = new InvoiceController();
