import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';

export class AnalyticsController {

  async monthly(req: Request, res: Response, next: NextFunction) {
    try {
      const months = Number(req.query.months) || 6;
      const result = await analyticsService.monthly(req.user!.userId, months);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async categories(req: Request, res: Response, next: NextFunction) {
    try {
      const month = Number(req.query.month);
      const year  = Number(req.query.year);
      if (!month || !year) {
        return res.status(400).json({ success: false, error: 'month e year s\u00E3o obrigat\u00F3rios' });
      }
      const result = await analyticsService.categories(req.user!.userId, month, year);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async projection(req: Request, res: Response, next: NextFunction) {
    try {
      const months = Number(req.query.months) || 6;
      const result = await analyticsService.projection(req.user!.userId, months);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async comparison(req: Request, res: Response, next: NextFunction) {
    try {
      const months = Number(req.query.months) || 4;
      const result = await analyticsService.comparison(req.user!.userId, months);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const analyticsController = new AnalyticsController();
