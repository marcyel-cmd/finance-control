import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const categoryRouter = Router();

// GET \u00E9 p\u00FAblico
categoryRouter.get('/', (req, res, next) => categoryController.list(req, res, next));

// Protegidas
categoryRouter.post('/',      authMiddleware, (req, res, next) => categoryController.create(req, res, next));
categoryRouter.put('/:id',    authMiddleware, (req, res, next) => categoryController.update(req, res, next));
categoryRouter.delete('/:id', authMiddleware, (req, res, next) => categoryController.delete(req, res, next));

export { categoryRouter };
