import { Router } from 'express';
import {
    getQuotes,
    getQuoteById,
    createQuote,
    updateQuote,
    updateQuoteStatus,
    deleteQuote,
} from './quote.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
    createQuoteSchema,
    updateQuoteSchema,
    quoteStatusSchema,
    quoteQuerySchema,
} from './quote.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(quoteQuerySchema, 'query'), getQuotes);
router.get('/:id', getQuoteById);

router.post(
    '/',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(createQuoteSchema, 'body'),
    createQuote
);

router.patch(
    '/:id/status',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(quoteStatusSchema, 'body'),
    updateQuoteStatus
);

router.put(
    '/:id',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(updateQuoteSchema, 'body'),
    updateQuote
);

router.delete(
    '/:id',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    deleteQuote
);

export default router;
