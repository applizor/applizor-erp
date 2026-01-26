import { Router } from 'express';
import {
    createCategory,
    getCategories,
    createSubCategory,
    getSubCategories,
} from '../controllers/clientCategory.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createCategory);
router.get('/', authenticate, getCategories);
router.post('/sub', authenticate, createSubCategory);
router.get('/:categoryId/sub', authenticate, getSubCategories);

export default router;
