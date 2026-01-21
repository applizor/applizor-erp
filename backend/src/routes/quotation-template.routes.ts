import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate
} from '../controllers/quotation-template.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Template CRUD
router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

// Apply template (get template data and increment usage)
router.post('/:id/apply', applyTemplate);

export default router;
