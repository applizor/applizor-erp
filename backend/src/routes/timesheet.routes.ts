import { Router } from 'express';
import { createTimeEntry, bulkCreateTimeEntries, getTimesheets, updateTimeEntry, deleteTimeEntry, startTimer, stopTimer, getActiveTimer } from '../controllers/timesheet.controller';
import { authenticate, checkPermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', checkPermission('Timesheet', 'create'), createTimeEntry);
router.post('/bulk', checkPermission('Timesheet', 'create'), bulkCreateTimeEntries);
router.post('/timer/start', checkPermission('Timesheet', 'create'), startTimer);
router.post('/timer/stop', checkPermission('Timesheet', 'create'), stopTimer);
router.get('/timer/active', checkPermission('Timesheet', 'read'), getActiveTimer);
router.get('/', checkPermission('Timesheet', 'read'), getTimesheets);
router.patch('/:id', checkPermission('Timesheet', 'update'), updateTimeEntry);
router.delete('/:id', checkPermission('Timesheet', 'delete'), deleteTimeEntry);

export default router;
