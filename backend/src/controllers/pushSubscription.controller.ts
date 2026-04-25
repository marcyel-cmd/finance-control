import { Request, Response, NextFunction } from 'express';
import { pushSubscriptionService } from '../services/pushSubscription.service';
import { subscribeSchema, unsubscribeSchema } from '../validators/pushSubscription.validator';
import { VAPID_PUBLIC_KEY, isPushConfigured } from '../lib/webPush';

export class PushSubscriptionController {

  // Endpoint público — frontend precisa da chave pública pra criar a subscription.
  // A privada NUNCA é exposta.
  async vapidPublicKey(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: { publicKey: VAPID_PUBLIC_KEY, configured: isPushConfigured },
      });
    } catch (error) { next(error); }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pushSubscriptionService.list(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = subscribeSchema.parse(req.body);
      const result = await pushSubscriptionService.subscribe(req.user!.userId, data);
      res.status(201).json({ success: true, data: { id: result.id, endpoint: result.endpoint } });
    } catch (error) { next(error); }
  }

  async unsubscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = unsubscribeSchema.parse(req.body);
      const result = await pushSubscriptionService.unsubscribe(req.user!.userId, data.endpoint);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  // Envia uma notificação de teste pra todas subs do usuário — útil pra UI confirmar.
  async test(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await pushSubscriptionService.sendToUser(req.user!.userId, {
        title: 'Teste de notificação 🔔',
        body: 'Se você tá vendo isso, o push tá funcionando!',
        url: '/',
        tag: 'test',
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const pushSubscriptionController = new PushSubscriptionController();
