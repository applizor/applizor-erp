"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // 1. Create Default Company
    const companyName = 'Applizor Softech';
    let company = await prisma.company.findFirst({ where: { name: companyName } });
    if (!company) {
        console.log('Creating default company...');
        company = await prisma.company.create({
            data: {
                name: companyName,
                email: 'info@applizor.com',
                phone: '1234567890',
                address: 'Tech Park, Bangalore',
                country: 'India',
                enabledModules: ["HRMS", "CRM", "PAYROLL", "PROJECTS", "FINANCE"]
            }
        });
    }
    else {
        console.log('Default company already exists.');
    }
    // 2. Create Admin Role
    const roleName = 'Admin';
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
        console.log('Creating Admin role...');
        role = await prisma.role.create({ data: { name: roleName, isSystem: true, description: 'System Administrator' } });
    }
    // 2.1 Create Employee Role
    const empRoleName = 'Employee';
    let empRole = await prisma.role.findUnique({ where: { name: empRoleName } });
    if (!empRole) {
        console.log('Creating Employee role...');
        empRole = await prisma.role.create({ data: { name: empRoleName, isSystem: false, description: 'Standard Employee' } });
    }
    // 3. Create Admin User
    const adminEmail = 'admin@applizor.com';
    const adminPassword = 'admin123';
    let user = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
        console.log('Creating admin user...');
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 10);
        user = await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                firstName: 'System',
                lastName: 'Admin',
                companyId: company.id,
                roles: {
                    create: { roleId: role.id }
                }
            }
        });
        console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
    }
    else {
        console.log('Admin user already exists.');
        // Optional: Reset password if known issue
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, companyId: company.id } // Ensure company link
        });
        console.log('✅ Admin user updated with default password.');
    }
    // 4. Create Departments
    console.log('Creating departments...');
    const depts = [
        { name: 'Information Technology', description: 'Software and Infrastructure' },
        { name: 'Human Resources', description: 'People and Culture' },
        { name: 'Sales & Marketing', description: 'Revenue and Growth' }
    ];
    const departments = [];
    for (const d of depts) {
        let dept = await prisma.department.findUnique({
            where: { companyId_name: { companyId: company.id, name: d.name } }
        });
        if (!dept) {
            dept = await prisma.department.create({
                data: { ...d, companyId: company.id }
            });
        }
        departments.push(dept);
    }
    // 5. Create Positions
    console.log('Creating positions...');
    const itDept = departments.find(d => d.name === 'Information Technology');
    const hrDept = departments.find(d => d.name === 'Human Resources');
    const salesDept = departments.find(d => d.name === 'Sales & Marketing');
    const posData = [
        { departmentId: itDept.id, title: 'Software Engineer' },
        { departmentId: itDept.id, title: 'Technical Lead' },
        { departmentId: hrDept.id, title: 'HR Manager' },
        { departmentId: salesDept.id, title: 'Sales Executive' }
    ];
    const positions = [];
    for (const p of posData) {
        let pos = await prisma.position.findUnique({
            where: { departmentId_title: { departmentId: p.departmentId, title: p.title } }
        });
        if (!pos) {
            pos = await prisma.position.create({ data: p });
        }
        positions.push(pos);
    }
    // 6. Create Default Shifts
    console.log('Creating default shifts...');
    let generalShift = await prisma.shift.findFirst({ where: { companyId: company.id, name: 'General Shift' } });
    if (!generalShift) {
        generalShift = await prisma.shift.create({
            data: {
                companyId: company.id,
                name: 'General Shift',
                startTime: '09:00',
                endTime: '18:00',
                workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
            }
        });
    }
    // 7. Create Leave Types
    console.log('Creating leave types...');
    const leaveTypes = [
        { name: 'Privilege Leave', days: 18, monthlyLimit: 2, isPaid: true, frequency: 'yearly' },
        { name: 'Casual Leave', days: 12, monthlyLimit: 1, isPaid: true, frequency: 'yearly' },
        { name: 'Sick Leave', days: 10, monthlyLimit: 2, isPaid: true, frequency: 'yearly' }
    ];
    for (const lt of leaveTypes) {
        await prisma.leaveType.upsert({
            where: { name: lt.name },
            update: lt,
            create: lt
        });
    }
    // 8. Create Employee Record for Admin
    let adminEmployee = await prisma.employee.findUnique({ where: { email: adminEmail } });
    if (!adminEmployee) {
        console.log('Creating employee record for Admin...');
        adminEmployee = await prisma.employee.create({
            data: {
                companyId: company.id,
                userId: user.id,
                employeeId: 'EMP001',
                firstName: 'System',
                lastName: 'Admin',
                email: adminEmail,
                dateOfJoining: new Date(),
                status: 'active',
                salary: 1000000,
                departmentId: hrDept.id,
                positionId: positions.find(p => p.title === 'HR Manager').id,
                shiftId: generalShift.id
            }
        });
    }
    // 9. Create 2 more Demo Employees
    const demoEmployees = [
        {
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            empId: 'EMP002',
            posTitle: 'Software Engineer',
            deptName: 'Information Technology'
        },
        {
            email: 'jane.smith@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            empId: 'EMP003',
            posTitle: 'Sales Executive',
            deptName: 'Sales & Marketing'
        }
    ];
    for (const de of demoEmployees) {
        let empUser = await prisma.user.findUnique({ where: { email: de.email } });
        if (!empUser) {
            console.log(`Creating user and employee for ${de.firstName}...`);
            const hashedPassword = await bcryptjs_1.default.hash('password123', 10);
            empUser = await prisma.user.create({
                data: {
                    email: de.email,
                    password: hashedPassword,
                    firstName: de.firstName,
                    lastName: de.lastName,
                    companyId: company.id
                }
            });
            const dept = departments.find(d => d.name === de.deptName);
            const pos = positions.find(p => p.title === de.posTitle);
            await prisma.employee.create({
                data: {
                    companyId: company.id,
                    userId: empUser.id,
                    employeeId: de.empId,
                    firstName: de.firstName,
                    lastName: de.lastName,
                    email: de.email,
                    dateOfJoining: new Date(),
                    status: 'active',
                    salary: 600000,
                    departmentId: dept.id,
                    positionId: pos.id,
                    shiftId: generalShift.id
                }
            });
            // Assign Employee role
            await prisma.userRole.upsert({
                where: {
                    userId_roleId: {
                        userId: empUser.id,
                        roleId: empRole.id
                    }
                },
                update: {},
                create: {
                    userId: empUser.id,
                    roleId: empRole.id
                }
            });
        }
    }
    // 10. Sync Role Permissions for Admin
    console.log('Syncing admin role permissions...');
    const SYSTEM_MODULES = [
        'Dashboard', 'Company', 'User', 'Role',
        'Client', 'Lead', 'Invoice', 'Payment', 'Subscription',
        'Department', 'Position', 'Employee', 'Attendance', 'Leave', 'LeaveType', 'LeaveBalance', 'Shift', 'ShiftRoster', 'Payroll', 'Asset', 'Holiday',
        'Recruitment', 'Document'
    ];
    let permCount = 0;
    for (const module of SYSTEM_MODULES) {
        await prisma.rolePermission.upsert({
            where: { roleId_module: { roleId: role.id, module } },
            update: {
                createLevel: 'all',
                readLevel: 'all',
                updateLevel: 'all',
                deleteLevel: 'all'
            },
            create: {
                roleId: role.id,
                module,
                createLevel: 'all',
                readLevel: 'all',
                updateLevel: 'all',
                deleteLevel: 'all'
            }
        });
        permCount++;
    }
    console.log(`✅ Synced ${permCount} role permissions for Admin.`);
    // 11. Sync Employee Role Permissions
    console.log('Syncing employee role permissions...');
    const EMPLOYEE_PERMISSIONS = [
        { module: 'Dashboard', readLevel: 'all' },
        { module: 'Employee', readLevel: 'owned', updateLevel: 'owned' },
        { module: 'Leave', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned' },
        { module: 'LeaveBalance', readLevel: 'owned' },
        { module: 'Attendance', createLevel: 'owned', readLevel: 'owned' },
        { module: 'Department', readLevel: 'all' },
        { module: 'Position', readLevel: 'all' },
        { module: 'Shift', readLevel: 'all' },
        { module: 'Holiday', readLevel: 'all' },
    ];
    for (const perm of EMPLOYEE_PERMISSIONS) {
        await prisma.rolePermission.upsert({
            where: { roleId_module: { roleId: empRole.id, module: perm.module } },
            update: {
                createLevel: perm.createLevel || 'none',
                readLevel: perm.readLevel || 'none',
                updateLevel: perm.updateLevel || 'none',
                deleteLevel: 'none'
            },
            create: {
                roleId: empRole.id,
                module: perm.module,
                createLevel: perm.createLevel || 'none',
                readLevel: perm.readLevel || 'none',
                updateLevel: perm.updateLevel || 'none',
                deleteLevel: 'none'
            }
        });
    }
    console.log(`✅ Synced ${EMPLOYEE_PERMISSIONS.length} role permissions for Employee.`);
    console.log('🌱 Seeding completed.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map