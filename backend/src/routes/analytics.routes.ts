import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const analyticsRouter = Router();

analyticsRouter.use(authMiddleware);

analyticsRouter.get('/monthly',    (req, res, next) => analyticsController.monthly(req, res, next));
analyticsRouter.get('/categories', (req, res, next) => analyticsController.categories(req, res, next));
analyticsRouter.get('/projection', (req, res, next) => analyticsController.projection(req, res, next));
analyticsRouter.get('/comparison', (req, res, next) => analyticsController.comparison(req, res, next));

export { analyticsRouter };
