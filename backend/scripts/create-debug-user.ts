
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');
    const email = 'debug_admin@test.com';
    const password = 'password123';

    // 1. Ensure Company Exists
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: {
                name: 'Test Company',
                email: 'test@company.com',
                phone: '1234567890',
                address: '123 Test St'
            }
        });
        console.log('Created Company');
    }

    // 2. Ensure Role Exists
    let adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
    if (!adminRole) {
        adminRole = await prisma.role.create({
            data: {
                name: 'Admin',
                isSystem: true,
                description: 'System Admin',
                permissions: []
            }
        });
        console.log('Created Admin Role');
    }

    // 3. Create/Update User
    const hashedPassword = await bcrypt.hash(password, 10);

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                isActive: true,
                firstName: 'Debug',
                lastName: 'Admin',
                roles: {
                    create: { roleId: adminRole.id }
                },
                companyId: company.id
            }
        });
        console.log(`Created User: ${email}`);
    } else {
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });
        console.log(`Updated User Password: ${email}`);
    }

    // 4. Create/Update Employee
    let emp = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (!emp) {
        await prisma.employee.create({
            data: {
                userId: user.id,
                firstName: 'Debug',
                lastName: 'Admin',
                email,
                employeeId: 'DBG001',
                companyId: company.id,
                dateOfJoining: new Date(),
            }
        });
        console.log('Created Employee Record');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
