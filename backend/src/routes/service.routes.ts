import express from 'express';
import { authenticate } from '../middleware/auth';
import { getServices, createService, updateService, deleteService } from '../controllers/service.controller';
import { authorize } from '../middleware/auth';

const router = express.Router();

// Fetch services (accessible to all authenticated users)
router.get('/', authenticate, getServices);

// Admin-only CRUD actions
router.post('/', authenticate, authorize(['Admin', 'Super Admin']), createService);
router.put('/:id', authenticate, authorize(['Admin', 'Super Admin']), updateService);
router.delete('/:id', authenticate, authorize(['Admin', 'Super Admin']), deleteService);

export default router;
