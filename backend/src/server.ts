import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import fs from 'fs';
import passport from 'passport';
import { initSocket } from './socket';
import { errorHandler } from './middleware/errorHandler';
import prisma from './prisma/client';
import { config } from './config/env';
import { apiLimiter, authLimiter, tenantApiLimiter } from './middleware/rateLimiter';
import { initEmailQueue } from './services/email.service';
import { configurePassport } from './config/passport';

// Routes
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import invoiceRoutes from './routes/invoice.routes';
import clientRoutes from './routes/client.routes';
import clientCategoryRoutes from './routes/clientCategory.routes';
import paymentRoutes from './routes/payment.routes';

const app = express();

// Middleware
// CORS - properly restrictive
const allowedOrigins = [
    config.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

// Rate limiting
app.use('/api/', tenantApiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Passport for SSO
app.use(passport.initialize());
configurePassport();

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

app.get('/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }
  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    message: 'Applizor ERP Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbStatus,
      uptime: process.uptime()
    }
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
import taxDeclarationRoutes from './routes/tax-declaration.routes';
import accountingRoutes from './routes/accounting.routes';
app.use('/api/payroll/components', salaryComponentRoutes);
app.use('/api/payroll/structure', salaryStructureRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/tax-declarations', taxDeclarationRoutes);

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
import expenseRoutes from './routes/expense.routes';
import exitRoutes from './routes/exit.routes';
import onboardingRoutes from './routes/onboarding.routes';
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/exit', exitRoutes);
app.use('/api/onboarding', onboardingRoutes);

import settingsRoutes from './routes/settings.routes';
app.use('/api/settings', settingsRoutes);

import notificationRoutes from './routes/notification.routes';
app.use('/api/notifications', notificationRoutes);

import searchRoutes from './routes/search.routes';
app.use('/api/search', searchRoutes);

import emailRoutes from './routes/email.routes';
app.use('/api/emails', emailRoutes);

import subscriptionPlanRoutes from './routes/subscription-plan.routes';
import subscriptionRoutes from './routes/subscription.routes';
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

import serviceRoutes from './routes/service.routes';
app.use('/api/services', serviceRoutes);

import certificateRoutes from './routes/certificate.routes';
app.use('/api/certificates', certificateRoutes);

import experienceLetterRoutes from './routes/experience-letter.routes';
app.use('/api/employees', experienceLetterRoutes);

import reconciliationRoutes from './routes/reconciliation.routes';
app.use('/api/accounting', reconciliationRoutes);

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

import coaTemplateRoutes from './routes/coa-template.routes';
app.use('/api/platform/coa', coaTemplateRoutes);

import platformRoutes from './routes/platform.routes';
app.use('/api/platform', platformRoutes);

import currencyRoutes from './routes/currency.routes';
app.use('/api/currencies', currencyRoutes);

import bulkImportRoutes from './routes/bulk-import.routes';
app.use('/api/bulk-import', bulkImportRoutes);



function resolveSwaggerDocPath(): string | null {
  const candidates = [
    path.join(__dirname, 'swagger.json'),           // dist/src/swagger.json (if copied alongside compiled server)
    path.join(__dirname, '..', 'swagger.json'),     // dist/swagger.json (production Docker layout)
    path.join(process.cwd(), 'src', 'swagger.json'), // local dev (tsx/ts-node)
    path.join(process.cwd(), 'dist', 'swagger.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

app.get('/api/system/docs', (req, res) => {
  const swaggerFile = resolveSwaggerDocPath();
  if (swaggerFile) {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(swaggerFile);
  } else {
    res.status(503).json({
      error: 'API documentation file not found on server. Run "node swagger.js" during build/deploy.',
      hint: 'Expected swagger.json in dist/ or src/ directory.',
    });
  }
});

// Global error handler (must be last middleware)
app.use(errorHandler);

// Handle unhandled rejections
process.on('unhandledRejection', (reason: Error) => {
    console.error('UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (err: Error) => {
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
});

import { SchedulerService } from './services/scheduler.service';
SchedulerService.init();

const server = http.createServer(app);
initSocket(server);

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
        prisma.$disconnect().then(() => {
            console.log('Database connections closed.');
            process.exit(0);
        });
    });
    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(config.PORT, () => {
  console.log(`🚀 Server running on port ${config.PORT}`);
  console.log(`📊 Health check: http://localhost:${config.PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${config.PORT}/api/auth`);
  console.log(`🏢 Company API: http://localhost:${config.PORT}/api/company`);
  console.log(`📄 Invoice API: http://localhost:${config.PORT}/api/invoices`);
  console.log(`👥 Client API: http://localhost:${config.PORT}/api/clients`);
  console.log(`📈 Lead API: http://localhost:${config.PORT}/api/leads`);
  console.log(`💳 Payment API: http://localhost:${config.PORT}/api/payments`);
  console.log(`👥 Department API: http://localhost:${config.PORT}/api/departments`);
  console.log(`👔 Position API: http://localhost:${config.PORT}/api/positions`);
  console.log(`👨‍💼 Employee API: http://localhost:${config.PORT}/api/employees`);
  console.log(`🤝 Recruitment API: http://localhost:${config.PORT}/api/recruitment`);

  // Start background email queue processor
  initEmailQueue();
});

