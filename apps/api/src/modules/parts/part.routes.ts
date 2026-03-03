import { Router } from 'express';
import {
    getPartCategories,
    getPartCategoryById,
    createPartCategory,
    updatePartCategory,
    getParts,
    getPartById,
    createPart,
    updatePart,
    deletePart,
    createStockMovement,
    getStockMovements,
} from './part.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import { UserRole } from '@edwix/shared';
import {
    createPartCategorySchema,
    updatePartCategorySchema,
    createPartSchema,
    updatePartSchema,
    partQuerySchema,
    stockMovementSchema,
    stockMovementQuerySchema,
} from './part.schema';

const router = Router();

router.use(authenticate);

router.get('/categories', getPartCategories);
router.get('/categories/:id', getPartCategoryById);
router.post(
    '/categories',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(createPartCategorySchema, 'body'),
    createPartCategory
);
router.put(
    '/categories/:id',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(updatePartCategorySchema, 'body'),
    updatePartCategory
);

router.get('/', validate(partQuerySchema, 'query'), getParts);

router.get(
    '/:partId/movements',
    validate(stockMovementQuerySchema, 'query'),
    getStockMovements
);
router.post(
    '/:partId/movements',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(stockMovementSchema, 'body'),
    createStockMovement
);

router.get('/:id', getPartById);
router.post(
    '/',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(createPartSchema, 'body'),
    createPart
);
router.put(
    '/:id',
    requireRole(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.TECHNICIAN),
    validate(updatePartSchema, 'body'),
    updatePart
);
router.delete('/:id', requireRole(UserRole.ADMIN), deletePart);

export default router;
