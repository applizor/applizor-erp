import { Router } from 'express';
import { createTimeEntry, bulkCreateTimeEntries, getTimesheets, updateTimeEntry, deleteTimeEntry, startTimer, stopTimer, getActiveTimer } from '../controllers/timesheet.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createTimeEntry);
router.post('/bulk', bulkCreateTimeEntries);
router.post('/timer/start', startTimer);
router.post('/timer/stop', stopTimer);
router.get('/timer/active', getActiveTimer);
router.get('/', getTimesheets);
router.patch('/:id', updateTimeEntry);
router.delete('/:id', deleteTimeEntry);

export default router;
