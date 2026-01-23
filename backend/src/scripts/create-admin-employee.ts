import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Starting Admin Employee Fix...');

    const ADMIN_EMAIL = 'admin@applizor.com';

    // 1. Find the User
    const user = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
    });

    if (!user) {
        console.error('❌ Admin user not found! Did you run the seed?');
        return;
    }
    console.log('✅ Found Admin User:', user.id);

    if (!user.companyId) {
        console.error('❌ User does not belong to a company!');
        return;
    }

    // 2. Find Management Department
    const department = await prisma.department.findFirst({
        where: { name: 'Management', companyId: user.companyId },
    });

    if (!department) {
        console.error('❌ Management department not found!');
        return;
    }
    console.log('✅ Found Department:', department.name);

    // 3. Create/Find Director Position
    const position = await prisma.position.upsert({
        where: {
            departmentId_title: {
                departmentId: department.id,
                title: 'Director'
            }
        },
        update: {},
        create: {
            title: 'Director',
            description: 'Company Director',
            departmentId: department.id,
        },
    });
    console.log('✅ Position Ready:', position.title);

    // 4. Create Employee Record
    const employee = await prisma.employee.upsert({
        where: { userId: user.id },
        update: {}, // Don't change if exists
        create: {
            userId: user.id,
            companyId: user.companyId,
            departmentId: department.id,
            positionId: position.id,
            employeeId: 'EMP001',
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            dateOfJoining: new Date(),
            status: 'active',
        },
    });

    console.log('✅ Employee Record Created/Verified:', employee.id);
    console.log('🎉 Admin can now use Attendance & Leave modules!');
}

main()
    .catch((e) => {
        console.error('❌ Script failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
