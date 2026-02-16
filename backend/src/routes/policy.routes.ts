
import { Router } from 'express';
import { createPolicy, getPolicies, updatePolicy, deletePolicy } from '../controllers/policy.controller';
import { authenticate, checkPermission } from '../middleware/auth';

import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', checkPermission('Policy', 'read'), getPolicies);
router.post('/', checkPermission('Policy', 'create'), upload.single('file'), createPolicy);
router.put('/:id', checkPermission('Policy', 'update'), upload.single('file'), updatePolicy);
router.delete('/:id', checkPermission('Policy', 'delete'), deletePolicy);

export default router;
