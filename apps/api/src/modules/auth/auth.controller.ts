import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { prisma } from '../../config/database';
import { sendSuccess, sendCreated } from '../../utils/response';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendCreated(res, result, 'User registered successfully');
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const tokens = await authService.refresh(req.body.refreshToken);
      sendSuccess(res, tokens, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.body.refreshToken);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await authService.getProfile(req.user!.sub);
      sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  },

  async listUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
        orderBy: { firstName: 'asc' },
      });
      sendSuccess(res, users);
    } catch (err) {
      next(err);
    }
  },
};
