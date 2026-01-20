
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- ROLES & PERMISSIONS ---');
    const roles = await prisma.role.findMany({
        include: { permissions: true }
    });

    roles.forEach(r => {
        console.log(`Role: ${r.name}`);
        r.permissions.forEach(p => {
            if (p.module === 'Employee') {
                console.log(`  - Module: ${p.module}, Read: ${p.readLevel}, Create: ${p.createLevel}, Update: ${p.updateLevel}, Delete: ${p.deleteLevel}`);
            }
        });
    });

    console.log('\n--- EMPLOYEES & CREATOR ---');
    const employees = await prisma.employee.findMany({
        select: { id: true, firstName: true, lastName: true, createdById: true }
    });
    console.table(employees);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
