import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { prisma } from '../lib/prisma';

export class UserController {

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.me(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.updateMe(req.user!.userId, req.body);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.list(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.create(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.delete(req.user!.userId, req.params.id as string);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async listPasskeys(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.listPasskeys(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async deletePasskey(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.deletePasskey(req.user!.userId, req.params.passkeyId as string);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async health(_req: Request, res: Response) {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {}
    res.json({
      status: 'online',
      database: dbStatus,
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  }
}

export const userController = new UserController();
