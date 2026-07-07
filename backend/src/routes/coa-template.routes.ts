import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/superadmin';
import * as coaController from '../controllers/coa-template.controller';

const router = Router();

// Authenticated (read)
router.get('/templates', authenticate, coaController.listTemplates);
router.get('/templates/:id', authenticate, coaController.getTemplate);

// Super Admin (write)
router.post('/templates', authenticate, requireSuperAdmin, coaController.createTemplate);
router.post('/templates/:id/entries', authenticate, requireSuperAdmin, coaController.addEntry);
router.delete('/entries/:id', authenticate, requireSuperAdmin, coaController.removeEntry);
router.delete('/templates/:id', authenticate, requireSuperAdmin, coaController.deactivateTemplate);

// Apply template to company (needs super admin to apply to any company, or auth for own company)
router.post('/apply/:companyId', authenticate, requireSuperAdmin, coaController.applyTemplate);
router.post('/apply', authenticate, coaController.applyTemplate);

export default router;
