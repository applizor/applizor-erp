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
        console.log('✅ Default company already exists.');
    }
    // 2. Create Roles
    console.log('Creating roles...');
    // Admin Role
    let adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
    if (!adminRole) {
        adminRole = await prisma.role.create({
            data: {
                name: 'Admin',
                isSystem: true,
                description: 'System Administrator with full access'
            }
        });
        console.log('✅ Admin role created');
    }
    // HR Manager Role
    let hrRole = await prisma.role.findUnique({ where: { name: 'HR Manager' } });
    if (!hrRole) {
        hrRole = await prisma.role.create({
            data: {
                name: 'HR Manager',
                isSystem: false,
                description: 'HR Manager with employee and leave management access'
            }
        });
        console.log('✅ HR Manager role created');
    }
    // Employee Role
    let empRole = await prisma.role.findUnique({ where: { name: 'Employee' } });
    if (!empRole) {
        empRole = await prisma.role.create({
            data: {
                name: 'Employee',
                isSystem: false,
                description: 'Standard Employee with limited access'
            }
        });
        console.log('✅ Employee role created');
    }
    // 3. Create Departments
    console.log('Creating departments...');
    const depts = [
        { name: 'Information Technology', description: 'Software Development and Infrastructure' },
        { name: 'Human Resources', description: 'People Management and Culture' },
        { name: 'Sales & Marketing', description: 'Revenue Generation and Growth' },
        { name: 'Finance & Accounts', description: 'Financial Management' },
        { name: 'Operations', description: 'Business Operations' }
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
            console.log(`✅ Created department: ${d.name}`);
        }
        departments.push(dept);
    }
    // 4. Create Positions
    console.log('Creating positions...');
    const itDept = departments.find(d => d.name === 'Information Technology');
    const hrDept = departments.find(d => d.name === 'Human Resources');
    const salesDept = departments.find(d => d.name === 'Sales & Marketing');
    const financeDept = departments.find(d => d.name === 'Finance & Accounts');
    const posData = [
        { departmentId: itDept.id, title: 'Software Engineer', description: 'Develops software applications' },
        { departmentId: itDept.id, title: 'Senior Software Engineer', description: 'Senior developer role' },
        { departmentId: itDept.id, title: 'Technical Lead', description: 'Leads technical team' },
        { departmentId: hrDept.id, title: 'HR Manager', description: 'Manages HR operations' },
        { departmentId: hrDept.id, title: 'HR Executive', description: 'Handles HR tasks' },
        { departmentId: salesDept.id, title: 'Sales Executive', description: 'Handles sales' },
        { departmentId: salesDept.id, title: 'Sales Manager', description: 'Manages sales team' },
        { departmentId: financeDept.id, title: 'Accountant', description: 'Manages accounts' }
    ];
    const positions = [];
    for (const p of posData) {
        let pos = await prisma.position.findUnique({
            where: { departmentId_title: { departmentId: p.departmentId, title: p.title } }
        });
        if (!pos) {
            pos = await prisma.position.create({ data: p });
            console.log(`✅ Created position: ${p.title}`);
        }
        positions.push(pos);
    }
    // 5. Create Shifts
    console.log('Creating shifts...');
    const shifts = [
        {
            name: 'General Shift',
            startTime: '09:00',
            endTime: '18:00',
            breakDuration: 60,
            workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
        },
        {
            name: 'Morning Shift',
            startTime: '06:00',
            endTime: '15:00',
            breakDuration: 60,
            workDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
        },
        {
            name: 'Night Shift',
            startTime: '22:00',
            endTime: '07:00',
            breakDuration: 60,
            workDays: ["monday", "tuesday", "wednesday", "thursday", "friday"]
        }
    ];
    const createdShifts = [];
    for (const s of shifts) {
        let shift = await prisma.shift.findFirst({
            where: { companyId: company.id, name: s.name }
        });
        if (!shift) {
            shift = await prisma.shift.create({
                data: {
                    companyId: company.id,
                    ...s,
                    workDays: s.workDays
                }
            });
            console.log(`✅ Created shift: ${s.name}`);
        }
        createdShifts.push(shift);
    }
    const generalShift = createdShifts.find(s => s.name === 'General Shift');
    // 6. Create Leave Types
    console.log('Creating leave types...');
    const leaveTypes = [
        {
            name: 'Earned Leave',
            days: 18,
            monthlyLimit: 0,
            isPaid: true,
            frequency: 'monthly',
            accrualType: 'monthly',
            accrualRate: 1.5,
            maxAccrual: 18,
            minServiceDays: 90,
            carryForward: false,
            maxCarryForward: 0,
            maxConsecutiveDays: 4,
            quarterlyLimit: 0,
            probationQuota: 0,
            confirmationBonus: 0,
            color: '#3B82F6',
            description: 'Earned leave - 1.5 days per month (18 days annually)',
            policySettings: {
                noticePeriod: 14,
                minDaysForNotice: 4,
                includeNonWorkingDays: false
            }
        },
        {
            name: 'Sick/Casual Leave',
            days: 8,
            monthlyLimit: 0,
            isPaid: true,
            frequency: 'yearly',
            carryForward: false,
            proofRequired: true,
            quarterlyLimit: 2,
            probationQuota: 2,
            confirmationBonus: 4.5,
            color: '#10B981',
            description: 'Sick or casual leave - up to 8 days per year',
            policySettings: {
                minDaysForProof: 2,
                includeNonWorkingDays: false
            }
        },
        {
            name: 'Marriage Leave',
            days: 5,
            monthlyLimit: 0,
            isPaid: true,
            frequency: 'yearly',
            carryForward: false,
            maxConsecutiveDays: 5,
            quarterlyLimit: 0,
            probationQuota: 5,
            confirmationBonus: 0,
            color: '#EC4899',
            description: 'Marriage leave - 5 continuous working days',
            policySettings: {
                includeNonWorkingDays: false
            }
        },
        {
            name: 'Bereavement Leave',
            days: 4,
            monthlyLimit: 0,
            isPaid: true,
            frequency: 'yearly',
            carryForward: false,
            quarterlyLimit: 0,
            probationQuota: 4,
            confirmationBonus: 0,
            color: '#EF4444',
            description: 'Bereavement leave - 4 calendar days for immediate family member death',
            policySettings: {
                includeNonWorkingDays: true
            }
        }
    ];
    for (const lt of leaveTypes) {
        await prisma.leaveType.upsert({
            where: { name: lt.name },
            update: lt,
            create: lt
        });
        console.log(`✅ Created/Updated leave type: ${lt.name}`);
    }
    // 7. Create Users
    console.log('Creating users...');
    // Admin User
    const adminEmail = 'admin@applizor.com';
    const adminPassword = 'admin123';
    let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!adminUser) {
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 10);
        adminUser = await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                firstName: 'System',
                lastName: 'Admin',
                companyId: company.id,
                roles: {
                    create: { roleId: adminRole.id }
                }
            }
        });
        console.log(`✅ Admin user created: ${adminEmail} / ${adminPassword}`);
    }
    // HR Manager User
    const hrEmail = 'hr@applizor.com';
    const hrPassword = 'hr@123';
    let hrUser = await prisma.user.findUnique({ where: { email: hrEmail } });
    if (!hrUser) {
        const hashedPassword = await bcryptjs_1.default.hash(hrPassword, 10);
        hrUser = await prisma.user.create({
            data: {
                email: hrEmail,
                password: hashedPassword,
                firstName: 'HR',
                lastName: 'Manager',
                companyId: company.id,
                roles: {
                    create: { roleId: hrRole.id }
                }
            }
        });
        console.log(`✅ HR Manager user created: ${hrEmail} / ${hrPassword}`);
    }
    // Employee User
    const empEmail = 'emp1@test.com';
    const empPassword = 'emp1';
    let empUser = await prisma.user.findUnique({ where: { email: empEmail } });
    if (!empUser) {
        const hashedPassword = await bcryptjs_1.default.hash(empPassword, 10);
        empUser = await prisma.user.create({
            data: {
                email: empEmail,
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'Employee',
                companyId: company.id,
                roles: {
                    create: { roleId: empRole.id }
                }
            }
        });
        console.log(`✅ Employee user created: ${empEmail} / ${empPassword}`);
    }
    // 8. Create Employee Records
    console.log('Creating employee records...');
    // Admin Employee
    let adminEmployee = await prisma.employee.findFirst({
        where: {
            companyId: company.id,
            employeeId: 'EMP001'
        }
    });
    if (!adminEmployee) {
        adminEmployee = await prisma.employee.create({
            data: {
                companyId: company.id,
                userId: adminUser.id,
                employeeId: 'EMP001',
                firstName: 'System',
                lastName: 'Admin',
                email: adminEmail,
                dateOfJoining: new Date(),
                status: 'active',
                salary: 1500000,
                departmentId: hrDept.id,
                positionId: positions.find(p => p.title === 'HR Manager').id,
                shiftId: generalShift.id,
                employmentType: 'Full Time'
            }
        });
        console.log('✅ Admin employee record created');
    }
    // HR Manager Employee
    let hrEmployee = await prisma.employee.findFirst({
        where: {
            companyId: company.id,
            employeeId: 'EMP002'
        }
    });
    if (!hrEmployee) {
        hrEmployee = await prisma.employee.create({
            data: {
                companyId: company.id,
                userId: hrUser.id,
                employeeId: 'EMP002',
                firstName: 'HR',
                lastName: 'Manager',
                email: hrEmail,
                dateOfJoining: new Date(),
                status: 'active',
                salary: 800000,
                departmentId: hrDept.id,
                positionId: positions.find(p => p.title === 'HR Executive').id,
                shiftId: generalShift.id,
                employmentType: 'Full Time'
            }
        });
        console.log('✅ HR Manager employee record created');
    }
    // Test Employee
    let testEmployee = await prisma.employee.findFirst({
        where: {
            companyId: company.id,
            employeeId: 'EMP003'
        }
    });
    if (!testEmployee) {
        testEmployee = await prisma.employee.create({
            data: {
                companyId: company.id,
                userId: empUser.id,
                employeeId: 'EMP003',
                firstName: 'Test',
                lastName: 'Employee',
                email: empEmail,
                dateOfJoining: new Date(),
                status: 'active',
                salary: 600000,
                departmentId: itDept.id,
                positionId: positions.find(p => p.title === 'Software Engineer').id,
                shiftId: generalShift.id,
                employmentType: 'Full Time'
            }
        });
        console.log('✅ Test employee record created');
    }
    // 9. Setup Role Permissions
    console.log('Setting up role permissions...');
    const SYSTEM_MODULES = [
        'Dashboard', 'Company', 'User', 'Role',
        'Client', 'Lead', 'Invoice', 'Payment', 'Subscription',
        'Department', 'Position', 'Employee', 'Attendance', 'Leave', 'LeaveType', 'LeaveBalance', 'Shift', 'ShiftRoster', 'Payroll', 'Asset', 'Holiday',
        'Recruitment', 'Document', 'SalaryComponent'
    ];
    // Admin Permissions - Full Access
    for (const module of SYSTEM_MODULES) {
        await prisma.rolePermission.upsert({
            where: { roleId_module: { roleId: adminRole.id, module } },
            update: {
                createLevel: 'all',
                readLevel: 'all',
                updateLevel: 'all',
                deleteLevel: 'all'
            },
            create: {
                roleId: adminRole.id,
                module,
                createLevel: 'all',
                readLevel: 'all',
                updateLevel: 'all',
                deleteLevel: 'all'
            }
        });
    }
    console.log(`✅ Admin permissions synced (${SYSTEM_MODULES.length} modules)`);
    // HR Manager Permissions
    const HR_PERMISSIONS = [
        { module: 'Dashboard', readLevel: 'all' },
        { module: 'Employee', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
        { module: 'Department', readLevel: 'all' },
        { module: 'Position', readLevel: 'all' },
        { module: 'Leave', createLevel: 'all', readLevel: 'all', updateLevel: 'all', deleteLevel: 'all' },
        { module: 'LeaveType', readLevel: 'all' },
        { module: 'LeaveBalance', readLevel: 'all', updateLevel: 'all' },
        { module: 'Attendance', readLevel: 'all', updateLevel: 'all' },
        { module: 'Shift', readLevel: 'all' },
        { module: 'ShiftRoster', createLevel: 'all', readLevel: 'all', updateLevel: 'all' },
        { module: 'Holiday', readLevel: 'all' },
        { module: 'Recruitment', createLevel: 'all', readLevel: 'all', updateLevel: 'all' },
        { module: 'Payroll', readLevel: 'all' }
    ];
    for (const perm of HR_PERMISSIONS) {
        await prisma.rolePermission.upsert({
            where: { roleId_module: { roleId: hrRole.id, module: perm.module } },
            update: {
                createLevel: perm.createLevel || 'none',
                readLevel: perm.readLevel || 'none',
                updateLevel: perm.updateLevel || 'none',
                deleteLevel: perm.deleteLevel || 'none'
            },
            create: {
                roleId: hrRole.id,
                module: perm.module,
                createLevel: perm.createLevel || 'none',
                readLevel: perm.readLevel || 'none',
                updateLevel: perm.updateLevel || 'none',
                deleteLevel: perm.deleteLevel || 'none'
            }
        });
    }
    console.log(`✅ HR Manager permissions synced (${HR_PERMISSIONS.length} modules)`);
    // Employee Permissions
    const EMPLOYEE_PERMISSIONS = [
        { module: 'Dashboard', readLevel: 'all' },
        { module: 'Employee', readLevel: 'owned', updateLevel: 'owned' },
        { module: 'Leave', createLevel: 'owned', readLevel: 'owned', updateLevel: 'owned' },
        { module: 'LeaveBalance', readLevel: 'owned' },
        { module: 'Attendance', createLevel: 'owned', readLevel: 'owned' },
        { module: 'Department', readLevel: 'all' },
        { module: 'Position', readLevel: 'all' },
        { module: 'Shift', readLevel: 'all' },
        { module: 'Holiday', readLevel: 'all' }
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
    console.log(`✅ Employee permissions synced (${EMPLOYEE_PERMISSIONS.length} modules)`);
    console.log('\n🎉 Seeding completed successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('👤 HR Manager:');
    console.log(`   Email: ${hrEmail}`);
    console.log(`   Password: ${hrPassword}`);
    console.log('');
    console.log('👤 Employee:');
    console.log(`   Email: ${empEmail}`);
    console.log(`   Password: ${empPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map