import { Request, Response, NextFunction } from 'express';
import { customerService } from './customer.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response';

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search } = req.query as any;
        const { total, data } = await customerService.getCustomers(page, limit, search);
        sendPaginated(res, data, total, page, limit);
    } catch (error) {
        next(error);
    }
};

export const getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await customerService.getCustomerById(req.params.id);
        sendSuccess(res, customer);
    } catch (error) {
        next(error);
    }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await customerService.createCustomer(req.body);
        sendCreated(res, customer, 'Customer created successfully');
    } catch (error) {
        next(error);
    }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await customerService.updateCustomer(req.params.id, req.body);
        sendSuccess(res, customer, 'Customer updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await customerService.deleteCustomer(req.params.id);
        sendNoContent(res);
    } catch (error) {
        next(error);
    }
};
