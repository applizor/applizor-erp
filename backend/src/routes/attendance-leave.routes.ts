import express from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import * as leaveController from '../controllers/leave.controller';
import * as leaveProcessController from '../controllers/leave-carry-forward.controller';
import * as holidayController from '../controllers/holiday.controller';
import { authenticate } from '../middleware/auth';
import { uploadLeaveAttachment } from '../utils/upload';

const router = express.Router();

// Attendance Routes
router.post('/check-in', authenticate, attendanceController.checkIn);
router.post('/check-out', authenticate, attendanceController.checkOut);
router.get('/my-attendance', authenticate, attendanceController.getMyAttendance);
router.get('/all-attendance', authenticate, attendanceController.getAllAttendance);
router.get('/today-status', authenticate, attendanceController.getTodayStatus);

// Leave Routes
router.get('/leave-types', authenticate, leaveController.getLeaveTypes);
router.post('/leave-types', authenticate, leaveController.createLeaveType);
router.put('/leave-types/:id', authenticate, leaveController.updateLeaveType);
router.delete('/leave-types/:id', authenticate, leaveController.deleteLeaveType);

router.post('/leaves/calculate', authenticate, leaveController.calculateLeaveDaysValue);
router.post('/leaves/process-carry-forward', authenticate, leaveProcessController.processCarryForward);
router.post('/leaves/upload', authenticate, uploadLeaveAttachment.single('file'), leaveController.uploadAttachment);
router.post('/leaves', authenticate, leaveController.createLeaveRequest);
router.get('/my-leaves', authenticate, leaveController.getMyLeaveRequests);
router.get('/all-leaves', authenticate, leaveController.getAllLeaveRequests);
router.put('/leaves/:id/status', authenticate, leaveController.updateLeaveStatus);

router.get('/my-balances', authenticate, leaveController.getMyBalances);
router.get('/all-balances', authenticate, leaveController.getAllBalances);

// Holiday Routes
router.get('/holidays', authenticate, holidayController.getHolidays);
router.post('/holidays', authenticate, holidayController.createHoliday);
router.put('/holidays/:id', authenticate, holidayController.updateHoliday);
router.delete('/holidays/:id', authenticate, holidayController.deleteHoliday);

export default router;
