import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { initSocket } from './socket';

// Routes
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import invoiceRoutes from './routes/invoice.routes';
import clientRoutes from './routes/client.routes';
import clientCategoryRoutes from './routes/clientCategory.routes';
import paymentRoutes from './routes/payment.routes';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001'
    ];
    if (!origin) return callback(null, true);
    const isAllowedLocalhost = origin.includes('localhost:3000') || origin.includes('localhost:3001');
    const isDevTunnel = origin.endsWith('.devtunnels.ms');
    const isLocalIP = /^http:\/\/(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(origin);
    if (allowedOrigins.indexOf(origin) !== -1 || isAllowedLocalhost || isDevTunnel || isLocalIP) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
const uploadsDirs = [
  path.join(process.cwd(), 'uploads'),
  path.join(process.cwd(), 'uploads', 'letterheads'),
  path.join(process.cwd(), 'uploads', 'documents'),
  path.join(process.cwd(), 'uploads', 'temp')
];

uploadsDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res, path, stat) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    if (path.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
    }
  }
}));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Applizor ERP Backend API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Applizor ERP API',
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);

import roleRoutes from './routes/role.routes';
app.use('/api/roles', roleRoutes);

import branchRoutes from './routes/branch.routes';
app.use('/api/branches', branchRoutes);

import auditRoutes from './routes/audit.routes';
app.use('/api/audit-logs', auditRoutes);

import portalRoutes from './routes/portal.routes';
app.use('/api/portal', portalRoutes);

app.use('/api/company', companyRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/client-categories', clientCategoryRoutes);

import leadRoutes from './routes/lead.routes';
app.use('/api/leads', leadRoutes);

app.use('/api/payments', paymentRoutes);

import quotationRoutes from './routes/quotation.routes';
import quotationTemplateRoutes from './routes/quotation-template.routes';
app.use('/api/quotations', quotationRoutes);
app.use('/api/quotation-templates', quotationTemplateRoutes);

import departmentRoutes from './routes/department.routes';
import positionRoutes from './routes/position.routes';
import employeeRoutes from './routes/employee.routes';
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/employees', employeeRoutes);

import recruitmentRoutes from './routes/recruitment.routes';
app.use('/api/recruitment', recruitmentRoutes);

import performanceRoutes from './routes/performance.routes';
app.use('/api/performance', performanceRoutes);

import attendanceLeaveRoutes from './routes/attendance-leave.routes';
import shiftRosterRoutes from './routes/shift-roster.routes';
app.use('/api/attendance-leave', attendanceLeaveRoutes);
app.use('/api/shift-rosters', shiftRosterRoutes);

import shiftRoutes from './routes/shift.routes';
app.use('/api/shifts', shiftRoutes);

import ticketRoutes from './routes/ticket.routes';
app.use('/api/tickets', ticketRoutes);

import assetRoutes from './routes/asset.routes';
app.use('/api/assets', assetRoutes);

import documentRoutes from './routes/document.routes';
app.use('/api/documents', documentRoutes);

import documentTemplateRoutes from './routes/document-template.routes';
app.use('/api/document-templates', documentTemplateRoutes);

import salaryComponentRoutes from './routes/salary-component.routes';
import salaryStructureRoutes from './routes/salary-structure.routes';
import payrollRoutes from './routes/payroll.routes';
import accountingRoutes from './routes/accounting.routes';
app.use('/api/payroll/components', salaryComponentRoutes);
app.use('/api/payroll/structure', salaryStructureRoutes);
app.use('/api/payroll', payrollRoutes);

import salesRoutes from './routes/sales.routes';
app.use('/api/sales', salesRoutes);
app.use('/api/accounting', accountingRoutes);

import automationRoutes from './routes/automation.routes';
import uploadRoutes from './routes/upload.routes';
import portalUploadRoutes from './routes/portal.upload.routes';
app.use('/api/automation', automationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/portal/upload', portalUploadRoutes);

import policyRoutes from './routes/policy.routes';
app.use('/api/policies', policyRoutes);
import employeeDocumentRoutes from './routes/employee-document.routes';
app.use('/api/employee-documents', employeeDocumentRoutes);

import contractRoutes, { portalContractRouter } from './routes/contract.routes';
import contractTemplateRoutes from './routes/contract-template.routes';
app.use('/api/contracts', contractRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/portal/contracts', portalContractRouter);

import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import timesheetRoutes from './routes/timesheet.routes';
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/timesheets', timesheetRoutes);

import settingsRoutes from './routes/settings.routes';
app.use('/api/settings', settingsRoutes);

import notificationRoutes from './routes/notification.routes';
app.use('/api/notifications', notificationRoutes);

import subscriptionPlanRoutes from './routes/subscription-plan.routes';
app.use('/api/subscription-plans', subscriptionPlanRoutes);

import certificateRoutes from './routes/certificate.routes';
app.use('/api/certificates', certificateRoutes);

import studentRoutes from './routes/student.routes';
import courseRoutes from './routes/course.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import classRoutes from './routes/class.routes';
import lectureRoutes from './routes/lecture.routes';
import examRoutes from './routes/exam.routes';
app.use('/api/lms/students', studentRoutes);
app.use('/api/lms/courses', courseRoutes);
app.use('/api/lms/enrollments', enrollmentRoutes);
app.use('/api/lms/classes', classRoutes);
app.use('/api/lms/lectures', lectureRoutes);
app.use('/api/lms/exams', examRoutes);

import { SchedulerService } from './services/scheduler.service';
SchedulerService.init();

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`🏢 Company API: http://localhost:${PORT}/api/company`);
  console.log(`📄 Invoice API: http://localhost:${PORT}/api/invoices`);
  console.log(`👥 Client API: http://localhost:${PORT}/api/clients`);
  console.log(`📈 Lead API: http://localhost:${PORT}/api/leads`);
  console.log(`💳 Payment API: http://localhost:${PORT}/api/payments`);
  console.log(`👥 Department API: http://localhost:${PORT}/api/departments`);
  console.log(`👔 Position API: http://localhost:${PORT}/api/positions`);
  console.log(`👨‍💼 Employee API: http://localhost:${PORT}/api/employees`);
  console.log(`🤝 Recruitment API: http://localhost:${PORT}/api/recruitment`);
  // Removed AI routes
});

