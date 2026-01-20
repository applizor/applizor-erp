"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const SYSTEM_MODULES = [
    'Dashboard', 'Company', 'User', 'Role',
    'Client', 'Lead', 'Invoice', 'Payment', 'Subscription',
    'Department', 'Position', 'Employee', 'Attendance', 'Leave', 'Shift', 'Payroll', 'Asset',
    'Recruitment', 'Document'
];
async function main() {
    console.log('Fixing Admin Permissions...');
    // 1. Find Admin Role
    const adminRole = await prisma.role.findUnique({
        where: { name: 'Admin' }
    });
    if (!adminRole) {
        throw new Error('Admin role not found!');
    }
    console.log(`Found Admin Role: ${adminRole.id}`);
    // 2. Grant ALL Access to ALL Modules
    for (const module of SYSTEM_MODULES) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_module: {
                    roleId: adminRole.id,
                    module: module
                }
            },
            update: {
                createLevel: 'all',
                readLevel: 'all',
                updateLevel: 'all',
                deleteLevel: 'all'
            },
            create: {
                roleId: adminRole.id,
                module: module,
                createLevel: 'all',
                readLevel: 'all',
                updateLevel: 'all',
                deleteLevel: 'all'
            }
        });
        console.log(`Granted FULL access to ${module} for Admin`);
    }
    console.log('Admin Permissions Fixed!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=fix_admin_permissions.js.map