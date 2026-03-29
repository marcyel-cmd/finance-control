import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const transactionRouter = Router();

transactionRouter.use(authMiddleware);

// IMPORTANTE: rotas espec\u00EDficas ANTES de /:id
transactionRouter.get('/summary',              (req, res, next) => transactionController.summary(req, res, next));
transactionRouter.get('/forecasts',            (req, res, next) => transactionController.forecasts(req, res, next));
transactionRouter.get('/bills/:cardId',        (req, res, next) => transactionController.bills(req, res, next));
transactionRouter.get('/bills/:cardId/detail', (req, res, next) => transactionController.billDetail(req, res, next));
transactionRouter.post('/carry-forward',       (req, res, next) => transactionController.carryForward(req, res, next));

transactionRouter.get('/',    (req, res, next) => transactionController.list(req, res, next));
transactionRouter.post('/',   (req, res, next) => transactionController.create(req, res, next));
transactionRouter.get('/:id', (req, res, next) => transactionController.findById(req, res, next));
transactionRouter.put('/:id', (req, res, next) => transactionController.update(req, res, next));
transactionRouter.delete('/:id', (req, res, next) => transactionController.delete(req, res, next));

export { transactionRouter };
