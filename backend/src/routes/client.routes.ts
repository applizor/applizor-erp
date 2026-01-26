import { Router } from 'express';
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
} from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';
import { uploadLogo, uploadProfilePicture } from '../utils/upload';

const router = Router();

router.post('/', authenticate, createClient);
router.get('/', authenticate, getClients);
router.get('/:id', authenticate, getClient);
router.put('/:id', authenticate, updateClient);
router.delete('/:id', authenticate, deleteClient);

router.post('/upload', authenticate, uploadLogo.single('image'), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = `/uploads/logos/${req.file.filename}`;
  res.json({ filePath });
});

router.post('/upload-profile', authenticate, uploadProfilePicture.single('image'), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = `/uploads/profiles/${req.file.filename}`;
  res.json({ filePath });
});

export default router;
