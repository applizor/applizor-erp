
import express from 'express';
import { authenticate } from '../middleware/auth';
import * as notificationController from '../controllers/notification.controller';

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.put('/:id', notificationController.markAsRead);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.post('/mark-all-read', notificationController.markAllAsRead);
router.delete('/clear-all', notificationController.clearAll);

export default router;
