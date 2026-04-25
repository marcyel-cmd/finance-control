import { Router } from 'express';
import { transactionTemplateController } from '../controllers/transactionTemplate.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const transactionTemplateRouter = Router();

transactionTemplateRouter.use(authMiddleware);

transactionTemplateRouter.get('/',           (req, res, next) => transactionTemplateController.list(req, res, next));
transactionTemplateRouter.post('/',          (req, res, next) => transactionTemplateController.create(req, res, next));
transactionTemplateRouter.get('/:id',        (req, res, next) => transactionTemplateController.findById(req, res, next));
transactionTemplateRouter.put('/:id',        (req, res, next) => transactionTemplateController.update(req, res, next));
transactionTemplateRouter.delete('/:id',     (req, res, next) => transactionTemplateController.delete(req, res, next));
transactionTemplateRouter.post('/:id/use',   (req, res, next) => transactionTemplateController.use(req, res, next));

export { transactionTemplateRouter };
