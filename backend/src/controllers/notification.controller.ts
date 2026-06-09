import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { pushTokenService } from '../services/pushToken.service';
import { AppError } from '../middlewares/errorHandler';

export class NotificationController {

  // Registra o token de push nativo (FCM/APNs) do dispositivo mobile.
  async registerPushToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, platform } = req.body ?? {};
      if (!token || typeof token !== 'string') {
        throw new AppError(400, 'Token de push inválido');
      }
      if (platform !== 'ios' && platform !== 'android') {
        throw new AppError(400, "Plataforma inválida (use 'ios' ou 'android')");
      }
      const result = await pushTokenService.save(req.user!.userId, token, platform);
      res.status(201).json({ success: true, data: { id: result.id } });
    } catch (error) { next(error); }
  }

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
      const result = await notificationService.markRead(req.user!.userId, req.params.id as string);
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
      const result = await notificationService.markActionDone(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await notificationService.delete(req.user!.userId, req.params.id as string);
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
