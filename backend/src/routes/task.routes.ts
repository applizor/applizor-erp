import { Router } from 'express';
import { authenticate, checkPermission } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as taskController from '../controllers/task.controller';

const router = Router();

router.use(authenticate);

// List & Create
router.get('/', taskController.getTasks);
router.post('/', upload.array('files'), taskController.createTask); // Support multiple files

// Details, Update, Delete
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Comments
router.get('/:id/comments', taskController.getComments);
router.post('/:id/comments', taskController.addComment);
router.get('/:id/history', taskController.getTaskHistory);

export default router;
