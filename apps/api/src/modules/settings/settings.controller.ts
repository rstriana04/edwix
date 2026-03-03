import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response';

export const getBusinessProfile = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await settingsService.getBusinessProfile();
    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
};

export const updateBusinessProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await settingsService.updateBusinessProfile(req.body);
    sendSuccess(res, profile, 'Business profile updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getLaborRates = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await settingsService.getLaborRates();
    sendSuccess(res, rates);
  } catch (error) {
    next(error);
  }
};

export const getLaborRateById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rate = await settingsService.getLaborRateById(req.params.id);
    sendSuccess(res, rate);
  } catch (error) {
    next(error);
  }
};

export const createLaborRate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rate = await settingsService.createLaborRate(req.body);
    sendCreated(res, rate, 'Labor rate created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateLaborRate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rate = await settingsService.updateLaborRate(req.params.id, req.body);
    sendSuccess(res, rate, 'Labor rate updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteLaborRate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await settingsService.deleteLaborRate(req.params.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prefix } = req.query as { prefix?: string };
    const settings = await settingsService.getSettings(prefix);
    sendSuccess(res, settings);
  } catch (error) {
    next(error);
  }
};

export const upsertSetting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await settingsService.upsertSetting(req.body.key, req.body.value);
    sendSuccess(res, setting, 'Setting saved successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteSetting = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await settingsService.deleteSetting(req.params.key);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
};
