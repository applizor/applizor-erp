"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- COMPANIES ---');
    const companies = await prisma.company.findMany();
    console.table(companies.map(c => ({ id: c.id, name: c.name })));
    console.log('\n--- USERS ---');
    const users = await prisma.user.findMany({ include: { roles: { include: { role: true } } } });
    console.table(users.map(u => ({ id: u.id, email: u.email, companyId: u.companyId, roles: u.roles.map(r => r.role.name).join(', ') })));
    console.log('\n--- EMPLOYEES ---');
    const employees = await prisma.employee.findMany();
    console.table(employees.map(e => ({ id: e.id, name: e.firstName + ' ' + e.lastName, companyId: e.companyId, userId: e.userId })));
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=debug_data.js.map