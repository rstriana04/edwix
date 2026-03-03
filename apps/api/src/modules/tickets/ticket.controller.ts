import { Request, Response, NextFunction } from 'express';
import { ticketService } from './ticket.service';
import { sendSuccess, sendPaginated, sendCreated, sendNoContent } from '../../utils/response';

export const getTicketStatuses = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const statuses = await ticketService.getStatuses();
        sendSuccess(res, statuses);
    } catch (error) {
        next(error);
    }
};

export const getTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, search, customerId, deviceId, statusId, assignedTechnicianId } =
            req.query as Record<string, string | undefined>;
        const { total, data } = await ticketService.getTickets(
            Number(page),
            Number(limit),
            search,
            { customerId, deviceId, statusId, assignedTechnicianId }
        );
        sendPaginated(res, data, total, Number(page), Number(limit));
    } catch (error) {
        next(error);
    }
};

export const getTicketById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const includeSub = req.query.details === 'true';
        const ticket = await ticketService.getTicketById(req.params.id, includeSub);
        sendSuccess(res, ticket);
    } catch (error) {
        next(error);
    }
};

export const createTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ticket = await ticketService.createTicket(req.body);
        sendCreated(res, ticket, 'Ticket created successfully');
    } catch (error) {
        next(error);
    }
};

export const updateTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.sub;
        const ticket = await ticketService.updateTicket(req.params.id, userId, req.body);
        sendSuccess(res, ticket, 'Ticket updated successfully');
    } catch (error) {
        next(error);
    }
};

export const deleteTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ticketService.deleteTicket(req.params.id);
        sendNoContent(res);
    } catch (error) {
        next(error);
    }
};

export const addTicketNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.sub;
        const { content, isPublic } = req.body;
        const note = await ticketService.addNote(
            req.params.ticketId,
            userId,
            content,
            isPublic ?? false
        );
        sendCreated(res, note, 'Note added');
    } catch (error) {
        next(error);
    }
};
