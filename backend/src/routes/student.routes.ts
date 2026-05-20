import { Router } from 'express';
import { createStudent, getStudents, getStudentById, updateStudent, deleteStudent } from '../controllers/student.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getStudents);
router.get('/:id', authenticate, getStudentById);
router.post('/', authenticate, createStudent);
router.put('/:id', authenticate, updateStudent);
router.delete('/:id', authenticate, deleteStudent);

export default router;
