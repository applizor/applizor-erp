
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Diagnosing Data...');

    const companies = await prisma.company.findMany({
        include: {
            _count: {
                select: { salaryComponents: true, users: true }
            }
        }
    });

    console.log(`\n🏢 Found ${companies.length} Companies:`);
    companies.forEach(c => {
        console.log(`- [${c.id}] "${c.name}" (Users: ${c._count.users}, Components: ${c._count.salaryComponents})`);
    });

    const components = await prisma.salaryComponent.findMany();
    console.log(`\n💰 Total Salary Components: ${components.length}`);
    if (components.length > 0) {
        console.log('Sample Components:');
        components.forEach(c => {
            console.log(`- [${c.isActive ? 'ACTIVE' : 'INACTIVE'}] ${c.name} (${c.companyId})`);
        });
    }

    const users = await prisma.user.findMany({ select: { id: true, email: true, firstName: true } });
    console.log(`\n👤 Users:`);
    users.forEach(u => {
        // We need to find which company they belong to. 
        // The schema typically links User -> Employee -> Company OR User -> Company directly?
        // Let's check Employee relation
    });

    // Fetch employees to see company linkage
    const employees = await prisma.employee.findMany({
        include: { user: true, company: true }
    });

    console.log(`\n👷 Employees:`);
    employees.forEach(e => {
        console.log(`- ${e.user?.firstName} (${e.user?.email}) -> Company: ${e.company.name} [${e.companyId}]`);
    });

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
