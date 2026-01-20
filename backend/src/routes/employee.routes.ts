import express from 'express';
import { authenticate, checkPermission } from '../middleware/auth';
import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    uploadEmployeeDocument
} from '../controllers/employee.controller';
import { uploadDocument } from '../utils/upload';

const router = express.Router();

router.use(authenticate);

router.post('/', checkPermission('Employee', 'create'), createEmployee);
router.get('/', checkPermission('Employee', 'read'), getEmployees);
router.get('/:id', checkPermission('Employee', 'read'), getEmployeeById);
router.put('/:id', checkPermission('Employee', 'update'), updateEmployee);
router.delete('/:id', checkPermission('Employee', 'delete'), deleteEmployee);
router.post('/:id/documents', checkPermission('Employee', 'update'), uploadDocument.single('file'), (req, res) => {
    import('../controllers/employee.controller').then(mod => mod.uploadEmployeeDocument(req, res));
});

export default router;
