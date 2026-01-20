import { Router } from 'express';
import { createLead, getLeads, updateLead, deleteLead } from '../../controllers/crm/lead.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/', authenticate, getLeads);
router.post('/', authenticate, createLead);
router.put('/:id', authenticate, updateLead);
router.delete('/:id', authenticate, deleteLead);

export default router;
