import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    createDepartment,
    getDepartments,
    updateDepartment,
    deleteDepartment
} from '../controllers/department.controller';

const router = express.Router();

router.use(authenticate);

router.post('/', createDepartment);
router.get('/', getDepartments);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;
