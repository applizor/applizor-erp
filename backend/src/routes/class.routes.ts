import { Router } from 'express';
import { createClass, getClasses, getClassById, updateClass, deleteClass } from '../controllers/class.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getClasses);
router.get('/:id', authenticate, getClassById);
router.post('/', authenticate, createClass);
router.put('/:id', authenticate, updateClass);
router.delete('/:id', authenticate, deleteClass);

export default router;
