import { Router } from 'express';
import { createCourse, getCourses, getCourseById, updateCourse, deleteCourse } from '../controllers/course.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getCourses);
router.get('/:id', authenticate, getCourseById);
router.post('/', authenticate, createCourse);
router.put('/:id', authenticate, updateCourse);
router.delete('/:id', authenticate, deleteCourse);

export default router;
