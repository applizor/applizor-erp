
import { Router } from 'express';
import { createPolicy, getPolicies, deletePolicy } from '../controllers/policy.controller';
import { authenticate, checkPermission } from '../middleware/auth';

import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.post('/', checkPermission('Policy', 'create'), upload.single('file'), createPolicy);
router.get('/', checkPermission('Policy', 'read'), getPolicies);
router.delete('/:id', checkPermission('Policy', 'delete'), deletePolicy);

export default router;
