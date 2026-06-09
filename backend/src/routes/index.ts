import { Router } from 'express';
import { authRouter } from './auth.routes';
import { transactionRouter } from './transaction.routes';
import { cardRouter } from './card.routes';
import { categoryRouter } from './category.routes';
import { notificationRouter } from './notification.routes';
import { analyticsRouter } from './analytics.routes';
import { invoiceRouter } from './invoice.routes';
import { userRouter } from './user.routes';
import { recurringRouter } from './recurring.routes';
import { transactionTemplateRouter } from './transactionTemplate.routes';
import { pushRouter } from './pushSubscription.routes';
import { smartImportRouter } from './smartImport.routes';
import { authMiddleware } from '../middlewares/auth.middleware';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

router.use('/auth',          authRouter);
router.use('/transactions',  transactionRouter);
router.use('/cards',         cardRouter);
router.use('/categories',    categoryRouter);
router.use('/notifications', notificationRouter);
router.use('/analytics',     analyticsRouter);
router.use('/invoice',       invoiceRouter);
router.use('/users',         userRouter);
router.use('/recurring',     recurringRouter);
router.use('/transaction-templates', transactionTemplateRouter);
router.use('/push',          pushRouter);
router.use('/smart-import',  smartImportRouter);

// Atalho /monthly-data (mesma l\u00F3gica que /analytics/monthly)
router.get('/monthly-data', authMiddleware, (req, res, next) => analyticsController.monthly(req, res, next));

export { router };
