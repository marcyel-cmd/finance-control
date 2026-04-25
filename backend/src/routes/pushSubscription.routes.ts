import { Router } from 'express';
import { pushSubscriptionController } from '../controllers/pushSubscription.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const pushRouter = Router();

// Endpoint público — não exige auth. A chave pública não é segredo.
pushRouter.get('/vapid-public-key', (req, res, next) => pushSubscriptionController.vapidPublicKey(req, res, next));

pushRouter.use(authMiddleware);

pushRouter.get('/',             (req, res, next) => pushSubscriptionController.list(req, res, next));
pushRouter.post('/subscribe',   (req, res, next) => pushSubscriptionController.subscribe(req, res, next));
pushRouter.post('/unsubscribe', (req, res, next) => pushSubscriptionController.unsubscribe(req, res, next));
pushRouter.post('/test',        (req, res, next) => pushSubscriptionController.test(req, res, next));

export { pushRouter };
