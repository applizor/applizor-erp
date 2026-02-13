
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SYSTEM_MODULES = [
    'Dashboard', 'Company', 'User', 'Role',
    'Client', 'Lead', 'LeadActivity', 'Quotation', 'QuotationTemplate', 'Invoice', 'Payment', 'Subscription',
    'Department', 'Position', 'Employee', 'Attendance', 'Leave', 'LeaveType', 'LeaveBalance', 'Shift', 'ShiftRoster', 'Payroll', 'Asset',
    'SalaryComponent', 'SalaryStructure',
    'Recruitment', 'RecruitmentBoard',
    'Document',
    'Project', 'ProjectTask',
    'Timesheet',
    'Holiday', 'Contract'
];

async function sync() {
    console.log('🔄 Syncing System Permissions...');

    const roles = await prisma.role.findMany();
    let count = 0;

    for (const role of roles) {
        console.log(`Checking role: ${role.name}`);
        for (const module of SYSTEM_MODULES) {
            const existing = await prisma.rolePermission.findUnique({
                where: {
                    roleId_module: {
                        roleId: role.id,
                        module: module
                    }
                }
            });

            if (!existing) {
                console.log(`   + Adding module: ${module}`);
                // Give Admin full access by default
                const isSystemAdmin = role.name === 'Admin' || role.name === 'Super Admin';
                const level = isSystemAdmin ? 'all' : 'none';

                await prisma.rolePermission.create({
                    data: {
                        roleId: role.id,
                        module: module,
                        createLevel: level,
                        readLevel: level,
                        updateLevel: level,
                        deleteLevel: level
                    }
                });
                count++;
            }
        }
    }

    console.log(`✅ Sync Complete. Added ${count} missing permissions.`);
}

sync()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
