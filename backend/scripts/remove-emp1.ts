import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAndRemoveEmployee() {
    try {
        // Search for employee with email emp1@test.com
        const emp1 = await prisma.employee.findUnique({
            where: {
                email: 'emp1@test.com',
            },
        });

        if (!emp1) {
            console.log('\n❌ Employee with email "emp1@test.com" not found in the database.');

            // List all employees for reference
            const allEmployees = await prisma.employee.findMany({
                orderBy: { createdAt: 'desc' },
            });

            console.log('\n📋 All employees in the system:');
            console.log('================================');
            allEmployees.forEach((emp, index) => {
                console.log(`\n${index + 1}. Employee ID: ${emp.employeeId}`);
                console.log(`   Name: ${emp.firstName} ${emp.lastName}`);
                console.log(`   Email: ${emp.email}`);
            });

            return;
        }

        console.log('\n🔍 Found employee to remove:');
        console.log('=============================');
        console.log(`Employee ID: ${emp1.employeeId}`);
        console.log(`Name: ${emp1.firstName} ${emp1.lastName}`);
        console.log(`Email: ${emp1.email}`);
        console.log(`User ID: ${emp1.userId || 'None'}`);

        // Delete the employee (this will cascade to related records)
        await prisma.employee.delete({
            where: { id: emp1.id },
        });
        console.log('\n✅ Employee record deleted');

        // Delete associated user if exists
        if (emp1.userId) {
            try {
                await prisma.user.delete({
                    where: { id: emp1.userId },
                });
                console.log('✅ Associated user account deleted');
            } catch (error) {
                console.log('⚠️  User account may have already been deleted or does not exist');
            }
        }

        console.log('\n✅ Successfully removed emp1@test.com from the system!');

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findAndRemoveEmployee();
