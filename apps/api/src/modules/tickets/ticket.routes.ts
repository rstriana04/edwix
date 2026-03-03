import { Router } from 'express';
import {
    getTicketStatuses,
    getTickets,
    getTicketById,
    createTicket,
    updateTicket,
    deleteTicket,
    addTicketNote,
} from './ticket.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
    createTicketSchema,
    updateTicketSchema,
    ticketQuerySchema,
    ticketNoteSchema,
} from './ticket.schema';

const router = Router();

router.use(authenticate);

router.get('/statuses', getTicketStatuses);
router.get('/', validate(ticketQuerySchema, 'query'), getTickets);
router.get('/:id', getTicketById);

router.post(
    '/',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(createTicketSchema, 'body'),
    createTicket
);

router.put(
    '/:id',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(updateTicketSchema, 'body'),
    updateTicket
);

router.delete('/:id', requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN), deleteTicket);

router.post(
    '/:ticketId/notes',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(ticketNoteSchema, 'body'),
    addTicketNote
);

export default router;
