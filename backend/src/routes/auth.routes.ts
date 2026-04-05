import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const authRouter = Router();

// Protegida: apenas admins podem criar novos usuários
authRouter.post('/register', authMiddleware, adminMiddleware, (req, res, next) => authController.register(req, res, next));
authRouter.post('/login',                       (req, res, next) => authController.login(req, res, next));
authRouter.post('/refresh',                     (req, res, next) => authController.refresh(req, res, next));

// WebAuthn públicas
authRouter.post('/passkey/authenticate-options', (req, res, next) => authController.passkeyAuthOptions(req, res, next));
authRouter.post('/passkey/authenticate-verify',  (req, res, next) => authController.passkeyAuthVerify(req, res, next));

// Protegidas
authRouter.get ('/me',                           authMiddleware, (req, res, next) => authController.me(req, res, next));
authRouter.post('/logout',                       authMiddleware, (req, res) => authController.logout(req, res));
authRouter.post('/change-password',              authMiddleware, (req, res, next) => authController.changePassword(req, res, next));

// WebAuthn protegidas
authRouter.get ('/passkey/register-options',     authMiddleware, (req, res, next) => authController.passkeyRegisterOptions(req, res, next));
authRouter.post('/passkey/register-verify',      authMiddleware, (req, res, next) => authController.passkeyRegisterVerify(req, res, next));
authRouter.get ('/passkey/list',                 authMiddleware, (req, res, next) => authController.passkeyList(req, res, next));
authRouter.delete('/passkey/:id',                authMiddleware, (req, res, next) => authController.passkeyDelete(req, res, next));

export { authRouter };
