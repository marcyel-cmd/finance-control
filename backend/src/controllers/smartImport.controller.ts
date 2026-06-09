import { Request, Response, NextFunction } from 'express';
import { smartImportService } from '../services/smartImport.service';

export class SmartImportController {

  /**
   * POST /smart-import/parse
   * Receives multiple images, extracts transactions, checks duplicates
   */
  async parse(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado. Envie ao menos 1 imagem.' });
      }

      const filePaths = files.map(f => f.path);
      const result = await smartImportService.parse(req.user!.userId, filePaths);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /smart-import/save
   * Saves selected transactions after user review
   */
  async save(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactions } = req.body;
      if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ success: false, error: 'Nenhuma transação para importar.' });
      }

      const result = await smartImportService.save(req.user!.userId, transactions);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const smartImportController = new SmartImportController();
