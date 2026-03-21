import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const notificationRouter = Router();

notificationRouter.use(authMiddleware);

notificationRouter.get('/',              (req, res, next) => notificationController.list(req, res, next));
notificationRouter.get('/unread-count',  (req, res, next) => notificationController.unreadCount(req, res, next));
notificationRouter.patch('/read-all',    (req, res, next) => notificationController.markAllRead(req, res, next));
notificationRouter.delete('/read',       (req, res, next) => notificationController.deleteAllRead(req, res, next));
notificationRouter.patch('/:id/read',    (req, res, next) => notificationController.markRead(req, res, next));
notificationRouter.patch('/:id/action',  (req, res, next) => notificationController.markActionDone(req, res, next));
notificationRouter.delete('/:id',        (req, res, next) => notificationController.delete(req, res, next));

export { notificationRouter };
