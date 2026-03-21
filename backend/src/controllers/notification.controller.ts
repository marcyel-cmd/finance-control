import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';

export class NotificationController {

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await notificationService.list(req.user!.userId);
      const unreadCount = data.filter(n => !n.read).length;
      res.json({ success: true, data, meta: { count: data.length, unreadCount } });
    } catch (error) { next(error); }
  }

  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.getUnreadCount(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markRead(req.user!.userId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markAllRead(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async markActionDone(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.markActionDone(req.user!.userId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.delete(req.user!.userId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async deleteAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.deleteAllRead(req.user!.userId);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }
}

export const notificationController = new NotificationController();
