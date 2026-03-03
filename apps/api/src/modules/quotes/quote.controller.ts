import { Request, Response, NextFunction } from 'express';
import { quoteService } from './quote.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response';

export const getQuotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search, ticketId, customerId, status } =
            req.query as Record<string, string | undefined>;
        const { total, data } = await quoteService.getQuotes(
            Number(page),
            Number(limit),
            search,
            { ticketId, customerId, status: status as any }
        );
        sendPaginated(res, data, total, Number(page), Number(limit));
    } catch (error) {
        next(error);
    }
};

export const getQuoteById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const quote = await quoteService.getQuoteById(req.params.id);
        sendSuccess(res, quote);
    } catch (error) {
        next(error);
    }
};

export const createQuote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const quote = await quoteService.createQuote(req.body);
        sendCreated(res, quote, 'Quote created successfully');
    } catch (error) {
        next(error);
    }
};

export const updateQuote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const quote = await quoteService.updateQuote(req.params.id, req.body);
        sendSuccess(res, quote, 'Quote updated successfully');
    } catch (error) {
        next(error);
    }
};

export const updateQuoteStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { status } = req.body;
        const quote = await quoteService.updateQuoteStatus(req.params.id, status);
        sendSuccess(res, quote, 'Quote status updated');
    } catch (error) {
        next(error);
    }
};

export const deleteQuote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await quoteService.deleteQuote(req.params.id);
        sendNoContent(res);
    } catch (error) {
        next(error);
    }
};
