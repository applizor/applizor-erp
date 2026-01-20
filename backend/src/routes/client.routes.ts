import { Router } from 'express';
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
} from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createClient);
router.get('/', authenticate, getClients);
router.get('/:id', authenticate, getClient);
router.put('/:id', authenticate, updateClient);
router.delete('/:id', authenticate, deleteClient);

export default router;
