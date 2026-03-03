import { Request, Response, NextFunction } from 'express';
import { assetService } from './asset.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response';

export const listAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, status, category } = req.query as Record<string, string | undefined>;
    const { total, data } = await assetService.list(
      Number(page),
      Number(limit),
      search,
      status as any,
      category,
    );
    sendPaginated(res, data, total, Number(page), Number(limit));
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.getById(req.params.id);
    sendSuccess(res, asset);
  } catch (error) {
    next(error);
  }
};

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.create(req.body);
    sendCreated(res, asset, 'Asset created successfully');
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.update(req.params.id, req.body);
    sendSuccess(res, asset, 'Asset updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await assetService.delete(req.params.id);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
};

export const checkoutAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const checkout = await assetService.checkout(
      req.params.id,
      req.body.checkedOutToId,
      req.user!.sub,
      req.body.notes,
    );
    sendCreated(res, checkout, 'Asset checked out successfully');
  } catch (error) {
    next(error);
  }
};

export const checkinAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await assetService.checkin(req.params.id, req.body.notes);
    sendSuccess(res, asset, 'Asset checked in successfully');
  } catch (error) {
    next(error);
  }
};

export const addMaintenance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maintenance = await assetService.addMaintenance(
      req.params.id,
      req.user!.sub,
      req.body,
    );
    sendCreated(res, maintenance, 'Maintenance record added successfully');
  } catch (error) {
    next(error);
  }
};

export const getCheckouts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as Record<string, string | undefined>;
    const { total, data } = await assetService.getCheckouts(
      req.params.id,
      Number(page) || 1,
      Number(limit) || 20,
    );
    sendPaginated(res, data, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = req.query as Record<string, string | undefined>;
    const { total, data } = await assetService.getMaintenanceLog(
      req.params.id,
      Number(page) || 1,
      Number(limit) || 20,
    );
    sendPaginated(res, data, total, Number(page) || 1, Number(limit) || 20);
  } catch (error) {
    next(error);
  }
};
