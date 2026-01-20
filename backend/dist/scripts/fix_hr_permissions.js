"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- FIXING DATA ---');
    // 1. Get HR Manager User ID
    // We assume 'hr2' is the HR Manager. Let's find the user linked to employee 'hr2'
    const hrEmployee = await prisma.employee.findFirst({
        where: { firstName: 'hr2' },
        include: { user: true }
    });
    if (!hrEmployee || !hrEmployee.userId) {
        console.error('HR Manager (hr2) not found or has no user account.');
        // Fallback: Check for a role named "HR Manager"
    }
    else {
        const hrUserId = hrEmployee.userId;
        console.log(`Found HR Manager User ID: ${hrUserId}`);
        // 2. Update 'emp1' to be created by HR Manager
        const emp1 = await prisma.employee.findFirst({ where: { firstName: 'emp1' } });
        if (emp1) {
            await prisma.employee.update({
                where: { id: emp1.id },
                data: { createdById: hrUserId }
            });
            console.log(`✅ Linked 'emp1' to be created by 'hr2' (${hrUserId})`);
        }
    }
    // 3. Update 'HR Manager' Role Permissions
    // We need to find the role first.
    const hrRole = await prisma.role.findFirst({
        where: { name: { contains: 'Manager', mode: 'insensitive' } }
    });
    if (hrRole) {
        console.log(`Updating Role: ${hrRole.name}`);
        await prisma.rolePermission.upsert({
            where: {
                roleId_module: {
                    roleId: hrRole.id,
                    module: 'Employee'
                }
            },
            update: {
                readLevel: 'added', // Or 'both' if they should see their own too. Let's allow 'both' commonly.
                // Actually, user said "Added (My entry)". Let's set 'added' or 'both'. 'added' is safer for now to test.
                createLevel: 'all', // They can create
                updateLevel: 'added',
                deleteLevel: 'added'
            },
            create: {
                roleId: hrRole.id,
                module: 'Employee',
                readLevel: 'added',
                createLevel: 'all',
                updateLevel: 'added',
                deleteLevel: 'added'
            }
        });
        console.log(`✅ Updated permissions for role ${hrRole.name} to 'Added' level for Employees.`);
    }
    else {
        console.error('HR Manager role not found.');
    }
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=fix_hr_permissions.js.map