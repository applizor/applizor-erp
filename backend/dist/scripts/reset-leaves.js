"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting Leave Data Reset...');
    // 1. Delete all Leave Requests
    const deletedRequests = await prisma.leaveRequest.deleteMany({});
    console.log(`Deleted ${deletedRequests.count} Leave Requests.`);
    // 2. Delete all Leave Balances (Optional, but good for fresh start)
    const deletedBalances = await prisma.employeeLeaveBalance.deleteMany({});
    console.log(`Deleted ${deletedBalances.count} Employee Leave Balances.`);
    // 3. Reset Monthly Limits usage (Implicitly done by deleting requests, but good to know)
    console.log('All leave history wiped. Configuration (Leave Types) remains intact.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=reset-leaves.js.map