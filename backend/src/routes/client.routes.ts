import { Router } from 'express';
import {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getClientDocuments,
  approveDocument,
  rejectDocument,
  downloadDocument,
  deleteDocument
} from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';
import { requireModule } from '../middleware/enforcePlanLimit';
import { uploadLogo, uploadProfilePicture } from '../utils/upload';

const router = Router();

router.use(authenticate);
router.use(requireModule('crm'));

router.post('/', createClient);
router.get('/', getClients);
router.get('/:id', getClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// Document Approval Routes
router.get('/:id/documents', getClientDocuments);
router.get('/:id/documents/:documentId/download', downloadDocument);
router.post('/:id/documents/:documentId/approve', approveDocument);
router.post('/:id/documents/:documentId/reject', rejectDocument);
router.delete('/:id/documents/:documentId', deleteDocument);
router.post('/upload', uploadLogo.single('image'), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = `/uploads/logos/${req.file.filename}`;
  res.json({ filePath });
});

router.post('/upload-profile', uploadProfilePicture.single('image'), (req: any, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = `/uploads/profiles/${req.file.filename}`;
  res.json({ filePath });
});

export default router;
