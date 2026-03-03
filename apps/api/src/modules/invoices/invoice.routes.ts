import { Router } from 'express';
import {
    getInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    addPayment,
} from './invoice.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
    createInvoiceSchema,
    updateInvoiceSchema,
    paymentSchema,
    invoiceQuerySchema,
} from './invoice.schema';

const router = Router();

router.use(authenticate);

router.get('/', validate(invoiceQuerySchema, 'query'), getInvoices);
router.get('/:id', getInvoiceById);

router.post(
    '/',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(createInvoiceSchema, 'body'),
    createInvoice
);

router.put(
    '/:id',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(updateInvoiceSchema, 'body'),
    updateInvoice
);

router.post(
    '/:id/payments',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(paymentSchema, 'body'),
    addPayment
);

export default router;
