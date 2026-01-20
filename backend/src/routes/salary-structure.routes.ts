import express from 'express';
import { authorize, authenticate } from '../middleware/auth';
import {
    getEmployeeStructure,
    updateEmployeeStructure
} from '../controllers/salary-structure.controller';

const router = express.Router();

router.use(authenticate);

// Get structure
router.get('/:employeeId', authorize(['Admin', 'HR Manager']), getEmployeeStructure);

// Update structure
router.put('/:employeeId', authorize(['Admin', 'HR Manager']), updateEmployeeStructure);

export default router;
