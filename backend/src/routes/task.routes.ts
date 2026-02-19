import { Router } from 'express';
import { authenticate, checkPermission } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as taskController from '../controllers/task.controller';

const router = Router();

router.use(authenticate);

// List & Create
router.get('/', checkPermission('ProjectTask', 'read'), taskController.getTasks);
router.post('/', checkPermission('ProjectTask', 'create'), upload.array('files'), taskController.createTask); // Support multiple files

// Details, Update, Delete
router.get('/:id', checkPermission('ProjectTask', 'read'), taskController.getTaskById);
router.put('/:id', checkPermission('ProjectTask', 'update'), taskController.updateTask);
router.delete('/:id', checkPermission('ProjectTask', 'delete'), taskController.deleteTask);

// Analysis
router.get('/analysis/me', taskController.getMyTaskAnalysis);

// Comments
router.get('/:id/comments', taskController.getComments);
router.post('/:id/comments', taskController.addComment);
router.get('/:id/history', taskController.getTaskHistory);
router.delete('/:id/comments/:commentId', taskController.deleteTaskComment);

export default router;
