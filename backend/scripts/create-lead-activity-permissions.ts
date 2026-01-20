import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createLeadActivityPermissions() {
    console.log('Creating Lead Activity permissions...');

    try {
        // Get Admin role
        const adminRole = await prisma.role.findFirst({
            where: { name: 'Admin' }
        });

        if (!adminRole) {
            console.error('Admin role not found!');
            return;
        }

        console.log(`Found Admin role: ${adminRole.id}`);

        // Define Lead Activity permissions
        const leadActivityPermissions = [
            {
                module: 'LeadActivity',
                action: 'create',
                description: 'Create lead activities and followups',
                scope: 'all'
            },
            {
                module: 'LeadActivity',
                action: 'read',
                description: 'View lead activities and followups',
                scope: 'all'
            },
            {
                module: 'LeadActivity',
                action: 'update',
                description: 'Edit and complete lead activities',
                scope: 'all'
            },
            {
                module: 'LeadActivity',
                action: 'delete',
                description: 'Delete lead activities',
                scope: 'all'
            }
        ];

        // Create permissions and assign to Admin role
        for (const perm of leadActivityPermissions) {
            // Check if permission already exists
            const existing = await prisma.permission.findFirst({
                where: {
                    module: perm.module,
                    action: perm.action
                }
            });

            let permission;
            if (existing) {
                console.log(`Permission ${perm.module}:${perm.action} already exists`);
                permission = existing;
            } else {
                permission = await prisma.permission.create({
                    data: perm
                });
                console.log(`Created permission: ${perm.module}:${perm.action}`);
            }

            // Check if role already has this permission
            const rolePermExists = await prisma.rolePermission.findFirst({
                where: {
                    roleId: adminRole.id,
                    permissionId: permission.id
                }
            });

            if (!rolePermExists) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: adminRole.id,
                        permissionId: permission.id
                    }
                });
                console.log(`Assigned ${perm.module}:${perm.action} to Admin role`);
            } else {
                console.log(`Admin already has ${perm.module}:${perm.action}`);
            }
        }

        console.log('\n✅ Lead Activity permissions created and assigned to Admin role!');
        console.log('\nNOTE: Users need to logout and login again to get fresh permissions.');

    } catch (error) {
        console.error('Error creating permissions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createLeadActivityPermissions();
