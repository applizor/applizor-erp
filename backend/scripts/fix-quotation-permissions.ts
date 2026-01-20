import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixQuotationPermissions() {
    try {
        console.log('🔧 Fixing Quotation permissions for Admin role...');

        // Find Admin role
        const adminRole = await prisma.role.findFirst({
            where: { name: 'Admin' }
        });

        if (!adminRole) {
            console.error('❌ Admin role not found');
            return;
        }

        console.log(`✅ Found Admin role: ${adminRole.id}`);

        // Check if Quotation permission exists
        let quotationPerm = await prisma.rolePermission.findFirst({
            where: {
                roleId: adminRole.id,
                module: 'Quotation'
            }
        });

        if (quotationPerm) {
            // Update existing permission
            await prisma.rolePermission.update({
                where: { id: quotationPerm.id },
                data: {
                    createLevel: 'all',
                    readLevel: 'all',
                    updateLevel: 'all',
                    deleteLevel: 'all'
                }
            });
            console.log('✅ Updated existing Quotation permission to "all" for all actions');
        } else {
            // Create new permission
            await prisma.rolePermission.create({
                data: {
                    roleId: adminRole.id,
                    module: 'Quotation',
                    createLevel: 'all',
                    readLevel: 'all',
                    updateLevel: 'all',
                    deleteLevel: 'all'
                }
            });
            console.log('✅ Created new Quotation permission with "all" access');
        }

        console.log('🎉 Quotation permissions fixed successfully!');
        console.log('Please refresh your browser to see the changes.');

    } catch (error) {
        console.error('❌ Error fixing permissions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixQuotationPermissions();
