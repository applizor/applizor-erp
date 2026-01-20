"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- FIXING EMPLOYEE ROLE ---');
    const empRole = await prisma.role.findUnique({
        where: { name: 'Employee' }
    });
    if (empRole) {
        console.log(`Found Employee Role. isSystem: ${empRole.isSystem}`);
        await prisma.role.update({
            where: { name: 'Employee' },
            data: { isSystem: false }
        });
        console.log('✅ Updated Employee Role to isSystem: false');
    }
    else {
        console.error('Employee Role not found.');
    }
}
main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
//# sourceMappingURL=fix_employee_role.js.map