import { Router } from 'express';
import { createTimeEntry, bulkCreateTimeEntries, getTimesheets, updateTimeEntry, deleteTimeEntry, startTimer, stopTimer, getActiveTimer, pauseTimer, resumeTimer, getTaskTimers, submitTimesheets, approveTimesheets, rejectTimesheets } from '../controllers/timesheet.controller';
import { authenticate, checkPermission } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', checkPermission('Timesheet', 'create'), createTimeEntry);
router.post('/bulk', checkPermission('Timesheet', 'create'), bulkCreateTimeEntries);
router.post('/timer/start', checkPermission('Timesheet', 'create'), startTimer);
router.post('/timer/stop/:id', checkPermission('Timesheet', 'create'), stopTimer);
router.post('/timer/pause/:id', checkPermission('Timesheet', 'create'), pauseTimer);
router.post('/timer/resume/:id', checkPermission('Timesheet', 'create'), resumeTimer);
router.get('/timer/active', checkPermission('Timesheet', 'read'), getActiveTimer);
router.get('/timer/task/:taskId', checkPermission('Timesheet', 'read'), getTaskTimers);
router.get('/', checkPermission('Timesheet', 'read'), getTimesheets);
router.patch('/:id', checkPermission('Timesheet', 'update'), updateTimeEntry);
router.delete('/:id', checkPermission('Timesheet', 'delete'), deleteTimeEntry);

router.post('/submit', checkPermission('Timesheet', 'create'), submitTimesheets);
router.post('/approve', checkPermission('Timesheet', 'update'), approveTimesheets);
router.post('/reject', checkPermission('Timesheet', 'update'), rejectTimesheets);

export default router;
