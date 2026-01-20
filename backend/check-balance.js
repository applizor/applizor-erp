
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const email = 'emp1@test.com';
        const emp = await prisma.employee.findUnique({ where: { email } });
        if (!emp) {
            // Try finding any employee
            const first = await prisma.employee.findFirst();
            console.log('Emp1 not found, using:', first.email);
            return check(first);
        }
        await check(emp);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

async function check(emp) {
    const type = await prisma.leaveType.findUnique({ where: { name: 'Privilege Leave' } });
    console.log(`Checking balance for ${emp.email} - ${type.name}`);

    // Check LeaveAccrual record
    const accruals = await prisma.leaveAccrual.findMany({
        where: { employeeId: emp.id, leaveTypeId: type.id }
    });
    console.log('Accrual Logs:', accruals);

    // Check Balance
    const balance = await prisma.employeeLeaveBalance.findFirst({
        where: { employeeId: emp.id, leaveTypeId: type.id }
    });
    console.log('Current Balance Record:', balance);
}

run();
