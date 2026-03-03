import { Request, Response, NextFunction } from 'express';
import { deviceService } from './device.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response';

export const getDevices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search, customerId, categoryId } = req.query as any;
        const { total, data } = await deviceService.getDevices(page, limit, search, customerId, categoryId);
        sendPaginated(res, data, total, page, limit);
    } catch (error) {
        next(error);
    }
};

export const getDeviceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const device = await deviceService.getDeviceById(req.params.id);
        sendSuccess(res, device);
    } catch (error) {
        next(error);
    }
};

export const createDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const device = await deviceService.createDevice(req.body);
        sendCreated(res, device, 'Device created successfully');
    } catch (error) {
        next(error);
    }
};

export const updateDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const device = await deviceService.updateDevice(req.params.id, req.body);
        sendSuccess(res, device, 'Device updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteDevice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await deviceService.deleteDevice(req.params.id);
        sendNoContent(res);
    } catch (error) {
        next(error);
    }
};

export const getDeviceCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const categories = await deviceService.getCategories();
        sendSuccess(res, categories);
    } catch (error) {
        next(error);
    }
};
