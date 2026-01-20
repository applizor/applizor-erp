
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Promoting emp1 to Admin...');
    const email = 'emp1@test.com';

    // 1. Get User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error('User not found');
        return;
    }

    // 2. Get Admin Role
    let adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
    if (!adminRole) {
        // Create if missing
        adminRole = await prisma.role.create({
            data: {
                name: 'Admin',
                isSystem: true,
                description: 'System Admin',
                // permissions: undefined // Let it be default
            }
        });
        console.log('Created Admin Role');
    }

    // 3. Assign Role
    // Check if already has role
    const existing = await prisma.rolePermission.findFirst({
        where: {
            roleId: adminRole.id // Wait, RolePermission is NOT user role assignment. 
            // UserRole model exists?
            // Schema checking needed.
        }
    });

    // Let's check User model relations.
    // user.roles usually points to UserRole[]? or Role[] implicit?
    // In auth.controller: include: { roles: { include: { role: ... } } }
    // So there is a join table. Explicit many-to-many or `UserRole` model.

    // Let's assume UserRole model.
    // To be safe, I'll delete existing links and add new one.

    // Actually, let's just create the link.
    // I need to know the name of the join model.
    // Usually `UserRole` or similar. 
    // Let's try to query `prisma.userRole` (typical).

    // If I don't know the mode name, I can check schema. But I can't read schema right now efficiently.
    // Safe bet: Update User with nested write.

    await prisma.user.update({
        where: { id: user.id },
        data: {
            roles: {
                // deleteMany: {}, // Clear existing
                create: { roleId: adminRole.id }
            }
        }
    });

    console.log(`Promoted ${email} to Admin`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
