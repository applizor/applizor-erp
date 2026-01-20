import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissions() {
    try {
        console.log('🔍 Checking Quotation permissions...\n');

        // Get all roles
        const roles = await prisma.role.findMany({
            include: {
                permissions: {
                    where: { module: 'Quotation' }
                }
            }
        });

        console.log('📋 Roles and their Quotation permissions:');
        console.log('='.repeat(60));

        for (const role of roles) {
            console.log(`\n🎭 Role: ${role.name} (${role.id})`);
            if (role.permissions.length === 0) {
                console.log('   ❌ NO Quotation permissions found');
            } else {
                role.permissions.forEach(perm => {
                    console.log(`   ✅ Module: ${perm.module}`);
                    console.log(`      - Create: ${perm.createLevel}`);
                    console.log(`      - Read: ${perm.readLevel}`);
                    console.log(`      - Update: ${perm.updateLevel}`);
                    console.log(`      - Delete: ${perm.deleteLevel}`);
                });
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n🔍 Checking users with Admin role...\n');

        const adminRole = await prisma.role.findFirst({
            where: { name: 'Admin' },
            include: {
                userRoles: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (adminRole) {
            console.log(`Found ${adminRole.userRoles.length} users with Admin role:`);
            adminRole.userRoles.forEach(ur => {
                console.log(`   - ${ur.user.email} (${ur.user.firstName} ${ur.user.lastName})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPermissions();
