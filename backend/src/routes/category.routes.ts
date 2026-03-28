import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const categoryRouter = Router();

// Todas as rotas de categoria exigem autenticação
categoryRouter.get('/',      authMiddleware, (req, res, next) => categoryController.list(req, res, next));
categoryRouter.post('/',     authMiddleware, (req, res, next) => categoryController.create(req, res, next));
categoryRouter.put('/:id',   authMiddleware, (req, res, next) => categoryController.update(req, res, next));
categoryRouter.delete('/:id',authMiddleware, (req, res, next) => categoryController.delete(req, res, next));

export { categoryRouter };
