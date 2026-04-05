import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator';

export class AuthController {

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const tokens = await authService.refresh(refreshToken);
      res.json({ success: true, ...tokens });
    } catch (error) { next(error); }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.me(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async logout(_req: Request, res: Response) {
    res.json({ success: true });
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      res.json({ success: true, message: 'Senha alterada com sucesso' });
    } catch (error) { next(error); }
  }

  // ── WebAuthn ──────────────────────────────────────────

  async passkeyRegisterOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const options = await authService.getPasskeyRegisterOptions(req.user!.userId);
      res.json({ success: true, data: options });
    } catch (error) { next(error); }
  }

  async passkeyRegisterVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const { credential, deviceName } = req.body;
      const result = await authService.verifyPasskeyRegistration(req.user!.userId, credential, deviceName);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async passkeyAuthOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.getPasskeyAuthOptions(email);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async passkeyAuthVerify(req: Request, res: Response, next: NextFunction) {
    try {
      const { assertion, challengeKey } = req.body;
      const result = await authService.verifyPasskeyAuth(assertion, challengeKey);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async passkeyList(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.listPasskeys(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async passkeyDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.deletePasskey(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const authController = new AuthController();
