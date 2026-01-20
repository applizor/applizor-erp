import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAdminRole() {
    try {
        // First, let's see all roles
        const allRoles = await prisma.role.findMany({
            include: {
                _count: {
                    select: {
                        userRoles: true,
                        permissions: true,
                    },
                },
            },
        });

        console.log('\n📋 All roles in the system:');
        console.log('============================');
        allRoles.forEach((role, index) => {
            console.log(`\n${index + 1}. Role: ${role.name}`);
            console.log(`   ID: ${role.id}`);
            console.log(`   Description: ${role.description || 'N/A'}`);
            console.log(`   Is System Role: ${role.isSystem}`);
            console.log(`   Users with this role: ${role._count.userRoles}`);
            console.log(`   Permissions: ${role._count.permissions}`);
        });

        // Find the Admin role
        const adminRole = await prisma.role.findUnique({
            where: {
                name: 'Admin',
            },
            include: {
                userRoles: true,
                permissions: true,
            },
        });

        if (!adminRole) {
            console.log('\n❌ "Admin" role not found in the database.');
            return;
        }

        console.log('\n\n🔍 Found Admin role to remove:');
        console.log('================================');
        console.log(`Role Name: ${adminRole.name}`);
        console.log(`Description: ${adminRole.description || 'N/A'}`);
        console.log(`Users assigned: ${adminRole.userRoles.length}`);
        console.log(`Permissions: ${adminRole.permissions.length}`);

        if (adminRole.userRoles.length > 0) {
            console.log('\n⚠️  WARNING: This role is currently assigned to users:');
            for (const userRole of adminRole.userRoles) {
                const user = await prisma.user.findUnique({
                    where: { id: userRole.userId },
                });
                if (user) {
                    console.log(`   - ${user.firstName} ${user.lastName} (${user.email})`);
                }
            }
        }

        // Delete the role (this will cascade delete UserRoles and RolePermissions)
        await prisma.role.delete({
            where: { name: 'Admin' },
        });

        console.log('\n✅ Admin role deleted successfully!');
        console.log('✅ All associated user role assignments and permissions have been removed.');

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAdminRole();
