import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import invoiceRoutes from './routes/invoice.routes';
import clientRoutes from './routes/client.routes';
import clientCategoryRoutes from './routes/clientCategory.routes';
// import leadRoutes from './routes/lead.routes'; // This import is removed as it's duplicated by the CRM leadRoutes
import paymentRoutes from './routes/payment.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
// Server Entry Point - Updated
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Applizor ERP Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Applizor ERP API',
    version: '1.0.0'
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Role routes
import roleRoutes from './routes/role.routes';
app.use('/api/roles', roleRoutes);

// Branch routes
import branchRoutes from './routes/branch.routes';
app.use('/api/branches', branchRoutes);

// Audit routes
import auditRoutes from './routes/audit.routes';
app.use('/api/audit-logs', auditRoutes);

// CRM Routes (Sales only, leads moved to main routes below)
import salesRoutes from './routes/crm/sales.routes';
import portalRoutes from './routes/portal.routes';

app.use('/api/crm/sales', salesRoutes);
app.use('/api/portal', portalRoutes);

// Company routes
app.use('/api/company', companyRoutes);

// Invoice routes
app.use('/api/invoices', invoiceRoutes);

// Client routes
app.use('/api/clients', clientRoutes);
app.use('/api/client-categories', clientCategoryRoutes);

// Lead routes (main - with new CRM features)
import leadRoutes from './routes/lead.routes';
app.use('/api/leads', leadRoutes);


// Payment routes
app.use('/api/payments', paymentRoutes);

// Quotation routes
import quotationRoutes from './routes/quotation.routes';
import quotationTemplateRoutes from './routes/quotation-template.routes';
app.use('/api/quotations', quotationRoutes);
app.use('/api/quotation-templates', quotationTemplateRoutes);

// HRMS Routes
import departmentRoutes from './routes/department.routes';
import positionRoutes from './routes/position.routes';
import employeeRoutes from './routes/employee.routes';

app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/employees', employeeRoutes);

// Recruitment Routes
import recruitmentRoutes from './routes/recruitment.routes';
app.use('/api/recruitment', recruitmentRoutes);

// Attendance & Leave Routes
import attendanceLeaveRoutes from './routes/attendance-leave.routes';
import shiftRosterRoutes from './routes/shift-roster.routes';
app.use('/api/attendance-leave', attendanceLeaveRoutes);
app.use('/api/shift-rosters', shiftRosterRoutes);

// Shift Routes
import shiftRoutes from './routes/shift.routes';
app.use('/api/shifts', shiftRoutes);

// Asset Routes
import assetRoutes from './routes/asset.routes';
app.use('/api/assets', assetRoutes);

// Document Routes
import documentRoutes from './routes/document.routes';
app.use('/api/documents', documentRoutes);

import documentTemplateRoutes from './routes/document-template.routes';
app.use('/api/document-templates', documentTemplateRoutes);

// Payroll Routes
import salaryComponentRoutes from './routes/salary-component.routes';
import salaryStructureRoutes from './routes/salary-structure.routes';
// import payrollRoutes from './routes/payroll.routes';
import accountingRoutes from './routes/accounting.routes';

app.use('/api/payroll/components', salaryComponentRoutes);
app.use('/api/payroll/structure', salaryStructureRoutes);
// app.use('/api/payroll', payrollRoutes);

// ... other routes
app.use('/api/accounting', accountingRoutes);

// Automation/Debug Routes
// Automation/Debug Routes
import automationRoutes from './routes/automation.routes';
app.use('/api/automation', automationRoutes);

// Contract Routes
import contractRoutes, { portalContractRouter } from './routes/contract.routes';
import contractTemplateRoutes from './routes/contract-template.routes';

app.use('/api/contracts', contractRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/portal/contracts', portalContractRouter);

// Project Routes
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Scheduler
import { SchedulerService } from './services/scheduler.service';

// Start server
SchedulerService.init();

app.listen(PORT, () => {
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
  console.log(`📅 Attendance API: http://localhost:${PORT}/api/attendance-leave`);
});
