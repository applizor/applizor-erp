"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const company_routes_1 = __importDefault(require("./routes/company.routes"));
const invoice_routes_1 = __importDefault(require("./routes/invoice.routes"));
const client_routes_1 = __importDefault(require("./routes/client.routes"));
// import leadRoutes from './routes/lead.routes'; // This import is removed as it's duplicated by the CRM leadRoutes
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files
const path_1 = __importDefault(require("path"));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
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
app.use('/api/auth', auth_routes_1.default);
// Role routes
const role_routes_1 = __importDefault(require("./routes/role.routes"));
app.use('/api/roles', role_routes_1.default);
// Branch routes
const branch_routes_1 = __importDefault(require("./routes/branch.routes"));
app.use('/api/branches', branch_routes_1.default);
// Audit routes
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
app.use('/api/audit-logs', audit_routes_1.default);
// CRM Routes
const lead_routes_1 = __importDefault(require("./routes/crm/lead.routes"));
const sales_routes_1 = __importDefault(require("./routes/crm/sales.routes"));
const portal_routes_1 = __importDefault(require("./routes/portal.routes"));
app.use('/api/crm/leads', lead_routes_1.default);
app.use('/api/crm/sales', sales_routes_1.default);
app.use('/api/portal', portal_routes_1.default); // New Route
// Company routes
app.use('/api/company', company_routes_1.default);
// Invoice routes
app.use('/api/invoices', invoice_routes_1.default);
// Client routes
app.use('/api/clients', client_routes_1.default);
// Lead routes
app.use('/api/leads', lead_routes_1.default);
// Payment routes
app.use('/api/payments', payment_routes_1.default);
// HRMS Routes
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const position_routes_1 = __importDefault(require("./routes/position.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
app.use('/api/departments', department_routes_1.default);
app.use('/api/positions', position_routes_1.default);
app.use('/api/employees', employee_routes_1.default);
// Recruitment Routes
const recruitment_routes_1 = __importDefault(require("./routes/recruitment.routes"));
app.use('/api/recruitment', recruitment_routes_1.default);
// Attendance & Leave Routes
const attendance_leave_routes_1 = __importDefault(require("./routes/attendance-leave.routes"));
const shift_roster_routes_1 = __importDefault(require("./routes/shift-roster.routes"));
app.use('/api/attendance-leave', attendance_leave_routes_1.default);
app.use('/api/shift-rosters', shift_roster_routes_1.default);
// Shift Routes
const shift_routes_1 = __importDefault(require("./routes/shift.routes"));
app.use('/api/shifts', shift_routes_1.default);
// Asset Routes
const asset_routes_1 = __importDefault(require("./routes/asset.routes"));
app.use('/api/assets', asset_routes_1.default);
// Document Routes
const document_routes_1 = __importDefault(require("./routes/document.routes"));
app.use('/api/documents', document_routes_1.default);
const document_template_routes_1 = __importDefault(require("./routes/document-template.routes"));
app.use('/api/document-templates', document_template_routes_1.default);
// Payroll Routes
const salary_component_routes_1 = __importDefault(require("./routes/salary-component.routes"));
const salary_structure_routes_1 = __importDefault(require("./routes/salary-structure.routes"));
// import payrollRoutes from './routes/payroll.routes';
const accounting_routes_1 = __importDefault(require("./routes/accounting.routes"));
app.use('/api/payroll/components', salary_component_routes_1.default);
app.use('/api/payroll/structure', salary_structure_routes_1.default);
// app.use('/api/payroll', payrollRoutes);
// ... other routes
app.use('/api/accounting', accounting_routes_1.default);
// Start server
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
//# sourceMappingURL=server.js.map