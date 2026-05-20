import { Router } from 'express';
import { createEnrollment, getEnrollments, getEnrollmentById, updateEnrollment, deleteEnrollment } from '../controllers/enrollment.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getEnrollments);
router.get('/:id', authenticate, getEnrollmentById);
router.post('/', authenticate, createEnrollment);
router.put('/:id', authenticate, updateEnrollment);
router.delete('/:id', authenticate, deleteEnrollment);

export default router;
