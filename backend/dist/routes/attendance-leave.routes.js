"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const attendanceController = __importStar(require("../controllers/attendance.controller"));
const leaveController = __importStar(require("../controllers/leave.controller"));
const leaveProcessController = __importStar(require("../controllers/leave-carry-forward.controller"));
const holidayController = __importStar(require("../controllers/holiday.controller"));
const auth_1 = require("../middleware/auth");
const upload_1 = require("../utils/upload");
const router = express_1.default.Router();
// Attendance Routes
router.post('/check-in', auth_1.authenticate, attendanceController.checkIn);
router.post('/check-out', auth_1.authenticate, attendanceController.checkOut);
router.get('/my-attendance', auth_1.authenticate, attendanceController.getMyAttendance);
router.get('/all-attendance', auth_1.authenticate, attendanceController.getAllAttendance);
router.get('/today-status', auth_1.authenticate, attendanceController.getTodayStatus);
// Leave Routes
router.get('/leave-types', auth_1.authenticate, leaveController.getLeaveTypes);
router.post('/leave-types', auth_1.authenticate, leaveController.createLeaveType);
router.put('/leave-types/:id', auth_1.authenticate, leaveController.updateLeaveType);
router.delete('/leave-types/:id', auth_1.authenticate, leaveController.deleteLeaveType);
router.post('/leaves/calculate', auth_1.authenticate, leaveController.calculateLeaveDaysValue);
router.post('/leaves/process-carry-forward', auth_1.authenticate, leaveProcessController.processCarryForward);
router.post('/leaves/upload', auth_1.authenticate, upload_1.uploadLeaveAttachment.single('file'), leaveController.uploadAttachment);
router.post('/leaves', auth_1.authenticate, leaveController.createLeaveRequest);
router.get('/my-leaves', auth_1.authenticate, leaveController.getMyLeaveRequests);
router.get('/all-leaves', auth_1.authenticate, leaveController.getAllLeaveRequests);
router.put('/leaves/:id/status', auth_1.authenticate, leaveController.updateLeaveStatus);
router.get('/my-balances', auth_1.authenticate, leaveController.getMyBalances);
router.get('/all-balances', auth_1.authenticate, leaveController.getAllBalances);
// Holiday Routes
router.get('/holidays', auth_1.authenticate, holidayController.getHolidays);
router.post('/holidays', auth_1.authenticate, holidayController.createHoliday);
router.put('/holidays/:id', auth_1.authenticate, holidayController.updateHoliday);
router.delete('/holidays/:id', auth_1.authenticate, holidayController.deleteHoliday);
exports.default = router;
//# sourceMappingURL=attendance-leave.routes.js.map