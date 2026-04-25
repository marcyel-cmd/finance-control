import { Router } from 'express';
import { recurringController } from '../controllers/recurring.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const recurringRouter = Router();

recurringRouter.use(authMiddleware);

recurringRouter.get('/',         (req, res, next) => recurringController.list(req, res, next));
recurringRouter.post('/',        (req, res, next) => recurringController.create(req, res, next));
recurringRouter.post('/run-now', (req, res, next) => recurringController.runNow(req, res, next));
recurringRouter.get('/:id',      (req, res, next) => recurringController.findById(req, res, next));
recurringRouter.put('/:id',      (req, res, next) => recurringController.update(req, res, next));
recurringRouter.delete('/:id',   (req, res, next) => recurringController.delete(req, res, next));

export { recurringRouter };
