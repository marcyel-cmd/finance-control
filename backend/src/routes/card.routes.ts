import { Router } from 'express';
import { cardController } from '../controllers/card.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const cardRouter = Router();

cardRouter.use(authMiddleware);

cardRouter.get('/',                  (req, res, next) => cardController.list(req, res, next));
cardRouter.post('/',                 (req, res, next) => cardController.create(req, res, next));
cardRouter.get('/:id',              (req, res, next) => cardController.findById(req, res, next));
cardRouter.put('/:id',              (req, res, next) => cardController.update(req, res, next));
cardRouter.delete('/:id',           (req, res, next) => cardController.delete(req, res, next));
cardRouter.get('/:id/transactions', (req, res, next) => cardController.getTransactions(req, res, next));
cardRouter.post('/:id/pay-bill',    (req, res, next) => cardController.payBill(req, res, next));

export { cardRouter };
