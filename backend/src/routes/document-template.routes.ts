
import { Router } from 'express';
import { createTemplate, getTemplates, deleteTemplate, updateTemplate, getTemplatesByType } from '../controllers/document-template.controller';
import { authenticate, checkPermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', checkPermission('DocumentTemplate', 'create'), createTemplate);
router.get('/', checkPermission('DocumentTemplate', 'read'), getTemplates);
router.get('/type/:type', checkPermission('DocumentTemplate', 'read'), getTemplatesByType);
router.put('/:id', checkPermission('DocumentTemplate', 'update'), updateTemplate);
router.delete('/:id', checkPermission('DocumentTemplate', 'delete'), deleteTemplate);

export default router;
