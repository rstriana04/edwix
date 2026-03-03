import { Request, Response, NextFunction } from 'express';
import { invoiceService } from './invoice.service';
import { sendSuccess, sendPaginated, sendCreated } from '../../utils/response';

export const getInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search, ticketId, customerId, quoteId, status } =
            req.query as Record<string, string | undefined>;
        const { total, data } = await invoiceService.getInvoices(
            Number(page),
            Number(limit),
            search,
            { ticketId, customerId, quoteId, status: status as any }
        );
        sendPaginated(res, data, total, Number(page), Number(limit));
    } catch (error) {
        next(error);
    }
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoice = await invoiceService.getInvoiceById(req.params.id);
        sendSuccess(res, invoice);
    } catch (error) {
        next(error);
    }
};

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoice = await invoiceService.createInvoice(req.body);
        sendCreated(res, invoice, 'Invoice created successfully');
    } catch (error) {
        next(error);
    }
};

export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
        sendSuccess(res, invoice, 'Invoice updated successfully');
    } catch (error) {
        next(error);
    }
};

export const addPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const receivedById = req.user!.sub;
        const payment = await invoiceService.addPayment(
            req.params.id,
            receivedById,
            req.body
        );
        sendCreated(res, payment, 'Payment recorded');
    } catch (error) {
        next(error);
    }
};
