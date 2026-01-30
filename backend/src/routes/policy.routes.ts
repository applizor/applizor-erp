
import { Router } from 'express';
import { createPolicy, getPolicies, deletePolicy } from '../controllers/policy.controller';
import { authenticate, checkPermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', checkPermission('Policy', 'create'), createPolicy);
router.get('/', checkPermission('Policy', 'read'), getPolicies);
router.delete('/:id', checkPermission('Policy', 'delete'), deletePolicy);

export default router;
