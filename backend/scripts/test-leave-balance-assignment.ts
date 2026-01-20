import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLeaveBalanceAssignment() {
    try {
        console.log('\n🔍 Testing Automatic Leave Balance Assignment\n');
        console.log('='.repeat(60));

        // 1. Check existing leave types
        const leaveTypes = await prisma.leaveType.findMany({
            orderBy: { name: 'asc' }
        });

        console.log(`\n📋 Found ${leaveTypes.length} leave types in the system:`);
        leaveTypes.forEach((lt, index) => {
            console.log(`\n${index + 1}. ${lt.name}`);
            console.log(`   Days: ${lt.days}`);
            console.log(`   Departments: ${lt.departmentIds.length === 0 ? 'All' : lt.departmentIds.join(', ')}`);
            console.log(`   Positions: ${lt.positionIds.length === 0 ? 'All' : lt.positionIds.join(', ')}`);
        });

        // 2. Find the most recently created employee
        const recentEmployee = await prisma.employee.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                department: true,
                position: true,
            }
        });

        if (!recentEmployee) {
            console.log('\n❌ No employees found in the system.');
            console.log('Please create a new employee to test the functionality.');
            return;
        }

        console.log(`\n\n👤 Most Recent Employee:`);
        console.log('='.repeat(60));
        console.log(`Name: ${recentEmployee.firstName} ${recentEmployee.lastName}`);
        console.log(`Employee ID: ${recentEmployee.employeeId}`);
        console.log(`Email: ${recentEmployee.email}`);
        console.log(`Department: ${recentEmployee.department?.name || 'None'}`);
        console.log(`Position: ${recentEmployee.position?.title || 'None'}`);
        console.log(`Created: ${recentEmployee.createdAt.toISOString()}`);

        // 3. Check leave balances for this employee
        const currentYear = new Date().getFullYear();
        const balances = await prisma.employeeLeaveBalance.findMany({
            where: {
                employeeId: recentEmployee.id,
                year: currentYear
            },
            include: {
                leaveType: true
            },
            orderBy: {
                leaveType: { name: 'asc' }
            }
        });

        console.log(`\n\n💰 Leave Balances for ${currentYear}:`);
        console.log('='.repeat(60));

        if (balances.length === 0) {
            console.log('❌ No leave balances found for this employee!');
            console.log('\nThis might indicate:');
            console.log('1. The employee was created before the auto-assignment feature was implemented');
            console.log('2. No leave types match the employee\'s department/position');
            console.log('3. There was an error during employee creation');
        } else {
            console.log(`✅ Found ${balances.length} leave balance(s):\n`);
            balances.forEach((balance, index) => {
                console.log(`${index + 1}. ${balance.leaveType.name}`);
                console.log(`   Allocated: ${balance.allocated} days`);
                console.log(`   Used: ${balance.used} days`);
                console.log(`   Carried Over: ${balance.carriedOver} days`);
                console.log(`   Remaining: ${balance.allocated + balance.carriedOver - balance.used} days`);
                console.log('');
            });
        }

        // 4. Determine which leave types should have been assigned
        const applicableLeaveTypes = leaveTypes.filter(lt => {
            const deptMatch = lt.departmentIds.length === 0 ||
                (recentEmployee.departmentId && lt.departmentIds.includes(recentEmployee.departmentId));
            const posMatch = lt.positionIds.length === 0 ||
                (recentEmployee.positionId && lt.positionIds.includes(recentEmployee.positionId));
            return deptMatch && posMatch;
        });

        console.log('\n📊 Analysis:');
        console.log('='.repeat(60));
        console.log(`Expected leave types: ${applicableLeaveTypes.length}`);
        console.log(`Actual leave balances: ${balances.length}`);

        if (applicableLeaveTypes.length === balances.length) {
            console.log('\n✅ SUCCESS! All applicable leave types were assigned correctly.');
        } else {
            console.log('\n⚠️  MISMATCH! Expected and actual counts differ.');
            console.log('\nExpected leave types:');
            applicableLeaveTypes.forEach(lt => console.log(`  - ${lt.name}`));
            console.log('\nActual leave balances:');
            balances.forEach(b => console.log(`  - ${b.leaveType.name}`));
        }

        console.log('\n' + '='.repeat(60));
        console.log('Test Complete!');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ Error during test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLeaveBalanceAssignment();
