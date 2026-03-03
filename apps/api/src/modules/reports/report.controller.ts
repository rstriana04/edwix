import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service';
import { sendSuccess } from '../../utils/response';

export const getReportSummary = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportService.getSummary();
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getRevenueReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, groupBy } = req.query as Record<string, string | undefined>;
    const data = await reportService.getRevenueReport(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      groupBy as any,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getTicketStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as Record<string, string | undefined>;
    const data = await reportService.getTicketStats(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getTechnicianPerformance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = req.query as Record<string, string | undefined>;
    const data = await reportService.getTechnicianPerformance(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getInventoryAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lowStockOnly = req.query.lowStockOnly === 'true';
    const data = await reportService.getInventoryAnalysis(lowStockOnly);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getTopCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, limit } = req.query as Record<string, string | undefined>;
    const data = await reportService.getTopCustomers(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      limit ? Number(limit) : undefined,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const getPartsUsage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, limit } = req.query as Record<string, string | undefined>;
    const data = await reportService.getPartsUsage(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      limit ? Number(limit) : undefined,
    );
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
