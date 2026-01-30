
import { Router } from 'express';
import { createComponent, getComponents, updateComponent, deleteComponent } from '../controllers/salary-component.controller';
import { authenticate, checkPermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', checkPermission('Payroll', 'create'), createComponent);
router.get('/', checkPermission('Payroll', 'read'), getComponents);
router.put('/:id', checkPermission('Payroll', 'update'), updateComponent);
router.delete('/:id', checkPermission('Payroll', 'delete'), deleteComponent);

export default router;
