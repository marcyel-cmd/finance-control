import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const userRouter = Router();

// P\u00FAblico
userRouter.get('/health', (req, res) => userController.health(req, res));

// Protegidas
userRouter.get('/me',                    authMiddleware, (req, res, next) => userController.me(req, res, next));
userRouter.put('/me',                    authMiddleware, (req, res, next) => userController.updateMe(req, res, next));
userRouter.get('/',                      authMiddleware, (req, res, next) => userController.list(req, res, next));
userRouter.post('/',                     authMiddleware, (req, res, next) => userController.create(req, res, next));
userRouter.delete('/:id',               authMiddleware, (req, res, next) => userController.delete(req, res, next));
userRouter.get('/:id/passkeys',         authMiddleware, (req, res, next) => userController.listPasskeys(req, res, next));
userRouter.delete('/passkeys/:passkeyId', authMiddleware, (req, res, next) => userController.deletePasskey(req, res, next));

export { userRouter };
