import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding (Fresh Production Backup)...');

    // 1. Company Setup
    const companyId = "b81a0e3f-9301-43f7-a633-6db7e5fa54b0";
    const company = await prisma.company.upsert({
        where: { id: companyId },
        update: {},
        create: {
            id: companyId,
            name: "Applizor Softech LLP",
            legalName: "Applizor Softech LLP",
            email: "connect@applizor.com",
            phone: "9130309480",
            address: "209, WARD NO 7, VISHWAKARMA MUHALLA, GARROLI",
            city: "Chhatarpur",
            state: "Madhya Pradesh",
            country: "India",
            pincode: "471201",
            isActive: true,
            currency: "INR",
            gstin: "27AAAAA0000A1Z5",
            radius: 100
        }
    });
    console.log(`✅ Company: ${company.name}`);

    // 2. Roles & Permissions
    const adminRoleId = "fbd2165d-3336-49b8-9b1f-188fbcd27b25";
    const hrRoleId = "2efe4dac-9b40-4436-b299-badda6396405";
    const empRoleId = "2af33051-91e2-49b0-be8e-e879b80dc41c";

    const allModules = [
        "Dashboard", "Company", "User", "Role", "Client", "Lead", "LeadActivity",
        "Quotation", "Invoice", "Payment", "Subscription", "Department", "Position",
        "Employee", "Attendance", "Leave", "LeaveType", "LeaveBalance", "Shift",
        "ShiftRoster", "Payroll", "Asset", "Recruitment", "Document", "Holiday",
        "QuotationTemplate"
    ];

    const rolesData = [
        {
            id: adminRoleId,
            name: "Admin",
            description: "Full system access",
            isSystem: true,
            permissions: allModules.map(m => ({ module: m, create: "all", read: "all", update: "all", delete: "all" }))
        },
        {
            id: hrRoleId,
            name: "HR",
            description: "Human Resources Manager",
            isSystem: false,
            permissions: [
                "Employee", "Department", "Position", "Attendance", "Leave", "LeaveType",
                "LeaveBalance", "Shift", "Recruitment", "Payroll", "Asset", "Document"
            ].map(m => ({ module: m, create: "all", read: "all", update: "all", delete: "all" }))
        },
        {
            id: empRoleId,
            name: "Employee",
            description: "Regular Employee",
            isSystem: false,
            permissions: [
                { module: "Dashboard", create: "none", read: "all", update: "none", delete: "none" },
                { module: "Leave", create: "all", read: "owned", update: "owned", delete: "owned" },
                { module: "Document", create: "owned", read: "owned", update: "owned", delete: "none" },
                { module: "Employee", create: "none", read: "all", update: "none", delete: "none" },
                { module: "Attendance", create: "all", read: "owned", update: "owned", delete: "owned" },
                { module: "LeaveType", create: "none", read: "all", update: "none", delete: "none" },
                { module: "LeaveBalance", create: "none", read: "owned", update: "owned", delete: "none" },
                { module: "Shift", create: "none", read: "all", update: "none", delete: "none" },
                { module: "ShiftRoster", create: "none", read: "owned", update: "none", delete: "none" },
                { module: "Holiday", create: "none", read: "all", update: "none", delete: "none" },
                { module: "Department", create: "none", read: "all", update: "none", delete: "none" },
                { module: "Position", create: "none", read: "all", update: "none", delete: "none" }
            ]
        }
    ];

    for (const r of rolesData) {
        await prisma.role.upsert({
            where: { id: r.id },
            update: { name: r.name, description: r.description, isSystem: r.isSystem },
            create: { id: r.id, name: r.name, description: r.description, isSystem: r.isSystem }
        });

        for (const p of r.permissions) {
            await prisma.rolePermission.upsert({
                where: { roleId_module: { roleId: r.id, module: (p as any).module } },
                update: {
                    createLevel: (p as any).create || "none",
                    readLevel: (p as any).read || "none",
                    updateLevel: (p as any).update || "none",
                    deleteLevel: (p as any).delete || "none"
                },
                create: {
                    roleId: r.id,
                    module: (p as any).module,
                    createLevel: (p as any).create || "none",
                    readLevel: (p as any).read || "none",
                    updateLevel: (p as any).update || "none",
                    deleteLevel: (p as any).delete || "none"
                }
            });
        }
    }

    // 3. Departments & Positions
    const engineeringId = "a9e50298-d5db-4b87-8ab6-a8e12194321d";
    const hrDeptId = "80f8b173-8253-4dff-be66-3b8229770117";

    await prisma.department.upsert({
        where: { id: engineeringId },
        update: {},
        create: { id: engineeringId, companyId: company.id, name: "Engineering", description: "Software Development" }
    });

    await prisma.position.upsert({
        where: { id: "020858a5-3766-4388-99cb-39f9af2c2879" },
        update: {},
        create: { id: "020858a5-3766-4388-99cb-39f9af2c2879", departmentId: engineeringId, title: "Senior Software Engineer" }
    });

    await prisma.department.upsert({
        where: { id: hrDeptId },
        update: {},
        create: { id: hrDeptId, companyId: company.id, name: "HR", description: "Human Resources" }
    });

    await prisma.position.upsert({
        where: { id: "72eac940-3040-462e-8736-cf9f43547af2" },
        update: {},
        create: { id: "72eac940-3040-462e-8736-cf9f43547af2", departmentId: hrDeptId, title: "HR Manager" }
    });

    // 4. Leave Types
    const leaveTypes = [
        {
            id: "c01b69ee-83c0-482d-af93-ad1690bc371d",
            name: "Sick Leave",
            days: 4,
            isPaid: true,
            accrualType: "yearly",
            quarterlyLimit: 1,
            probationQuota: 1,
            confirmationBonus: 0,
            policySettings: { noticePeriod: 14, minDaysForProof: 2, minDaysForNotice: 4, includeNonWorkingDays: false }
        },
        {
            id: "6e2652ac-a743-42eb-a56f-561af5f05646",
            name: "Casual Leave",
            days: 4,
            isPaid: true,
            accrualType: "yearly",
            quarterlyLimit: 1,
            probationQuota: 1,
            confirmationBonus: 0,
            policySettings: { noticePeriod: 14, minDaysForProof: 2, minDaysForNotice: 4, includeNonWorkingDays: false }
        },
        {
            id: "9d6bebad-72ef-43c9-96e1-afa64c1616ef",
            name: "Earned Leaves",
            days: 18,
            isPaid: true,
            accrualType: "monthly",
            accrualRate: 1.5,
            maxAccrual: 0, // Reset to 0 (Unlimited)
            quarterlyLimit: 2,
            probationQuota: 1,
            confirmationBonus: 1.5,
            policySettings: { noticePeriod: 14, minDaysForProof: 2, minDaysForNotice: 4, includeNonWorkingDays: false }
        }
    ];

    for (const lt of leaveTypes) {
        await prisma.leaveType.upsert({
            where: { id: lt.id },
            update: {
                name: lt.name, days: lt.days, isPaid: lt.isPaid,
                accrualType: lt.accrualType,
                accrualRate: (lt as any).accrualRate || 0,
                maxAccrual: (lt as any).maxAccrual !== undefined ? lt.maxAccrual : 0,
                quarterlyLimit: lt.quarterlyLimit,
                probationQuota: lt.probationQuota,
                confirmationBonus: lt.confirmationBonus,
                policySettings: lt.policySettings,
                frequency: "yearly", carryForward: true, maxCarryForward: 5, monthlyLimit: 2, maxConsecutiveDays: 10
            },
            create: {
                id: lt.id, name: lt.name, days: lt.days, isPaid: lt.isPaid,
                accrualType: lt.accrualType,
                accrualRate: (lt as any).accrualRate || 0,
                maxAccrual: (lt as any).maxAccrual !== undefined ? lt.maxAccrual : 0,
                quarterlyLimit: lt.quarterlyLimit,
                probationQuota: lt.probationQuota,
                confirmationBonus: lt.confirmationBonus,
                policySettings: lt.policySettings,
                frequency: "yearly", carryForward: true, maxCarryForward: 5, monthlyLimit: 2, maxConsecutiveDays: 10
            }
        });
    }

    // 5. Admin User
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@applizor.com' },
        update: { password: hashedAdminPassword, companyId: company.id },
        create: {
            email: 'admin@applizor.com',
            password: hashedAdminPassword,
            firstName: 'Admin',
            lastName: 'User',
            companyId: company.id,
            isActive: true
        }
    });

    await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: adminRoleId } },
        update: {},
        create: { userId: adminUser.id, roleId: adminRoleId }
    });

    console.log('\n🎉 Fresh Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
