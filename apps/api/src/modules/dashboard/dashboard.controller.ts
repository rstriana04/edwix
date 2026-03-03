import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/response';

export const getDashboardIndicators = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const indicators = await dashboardService.getIndicators();
    sendSuccess(res, indicators);
  } catch (error) {
    next(error);
  }
};
