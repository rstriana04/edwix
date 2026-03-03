import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getDashboardIndicators } from './dashboard.controller';

const router = Router();

router.use(authenticate);
router.get('/indicators', getDashboardIndicators);

export default router;
