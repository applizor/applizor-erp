import express from 'express';
import { authorize, authenticate } from '../middleware/auth';
import {
    getComponents,
    createComponent,
    updateComponent,
    deleteComponent
} from '../controllers/salary-component.controller';

const router = express.Router();

// Allow 'Payroll' module access (or specific roles)
router.use(authenticate);

router.get('/', authorize(['Admin', 'HR Manager']), getComponents);
router.post('/', authorize(['Admin', 'HR Manager']), createComponent);
router.put('/:id', authorize(['Admin', 'HR Manager']), updateComponent);
router.delete('/:id', authorize(['Admin', 'HR Manager']), deleteComponent);

export default router;
