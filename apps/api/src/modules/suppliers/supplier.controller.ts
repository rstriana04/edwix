import { Request, Response, NextFunction } from 'express';
import { supplierService } from './supplier.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response';

export const getSuppliers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search } = req.query as Record<string, string | undefined>;
        const { total, data } = await supplierService.getSuppliers(
            Number(page),
            Number(limit),
            search
        );
        sendPaginated(res, data, total, Number(page), Number(limit));
    } catch (error) {
        next(error);
    }
};

export const getSupplierById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const supplier = await supplierService.getSupplierById(req.params.id);
        sendSuccess(res, supplier);
    } catch (error) {
        next(error);
    }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const supplier = await supplierService.createSupplier(req.body);
        sendCreated(res, supplier, 'Supplier created successfully');
    } catch (error) {
        next(error);
    }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const supplier = await supplierService.updateSupplier(req.params.id, req.body);
        sendSuccess(res, supplier, 'Supplier updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await supplierService.deleteSupplier(req.params.id);
        sendNoContent(res);
    } catch (error) {
        next(error);
    }
};
