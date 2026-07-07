import express from 'express';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  importEmployees,
  importAttendance,
  importShiftRoster,
  downloadEmployeeTemplate,
  downloadAttendanceTemplate,
  downloadShiftRosterTemplate,
} from '../controllers/bulk-import.controller';

const router = express.Router();

router.use(authenticate);

// Templates download
router.get('/templates/employees', downloadEmployeeTemplate);
router.get('/templates/attendance', downloadAttendanceTemplate);
router.get('/templates/shift-roster', downloadShiftRosterTemplate);

// Bulk imports
router.post('/employees', upload.single('file'), importEmployees);
router.post('/attendance', upload.single('file'), importAttendance);
router.post('/shift-roster', upload.single('file'), importShiftRoster);

export default router;
