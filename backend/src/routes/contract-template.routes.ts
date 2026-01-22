import { Router } from 'express';
import * as TemplateController from '../controllers/contract-template.controller';
import { authenticate, checkPermission } from '../middleware/auth';

const router = Router();

// Re-use 'Contract' permission module or create new 'ContractTemplate'?
// Let's reuse 'Contract' module for simplicity as they are tightly coupled.
// Or 'QuotationTemplate' exists, maybe 'Contract' covers both? 
// Let's stick to 'Contract' read/write rights for templates too.

router.post('/', authenticate, checkPermission('Contract', 'create'), TemplateController.createTemplate);
router.get('/', authenticate, checkPermission('Contract', 'read'), TemplateController.getTemplates);
router.get('/:id', authenticate, checkPermission('Contract', 'read'), TemplateController.getTemplateById);
router.put('/:id', authenticate, checkPermission('Contract', 'update'), TemplateController.updateTemplate);
router.delete('/:id', authenticate, checkPermission('Contract', 'delete'), TemplateController.deleteTemplate);

export default router;
