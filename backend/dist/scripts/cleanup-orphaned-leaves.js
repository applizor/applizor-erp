"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting cleanup of orphaned LeaveRequests...');
    // 1. Fetch all leave requests
    const leaves = await prisma.leaveRequest.findMany({
        include: { leaveType: true }
    });
    console.log(`Found ${leaves.length} total leave requests.`);
    let deletedCount = 0;
    for (const leave of leaves) {
        // If leaveType is null (meaning the relation failed to join because record is missing)
        // Prisma client usually returns null for the relation if the FK points to nothing, 
        // OR we can check if the foreign key exists manually. 
        // Actually, with strict relational integrity, this shouldn't happen. 
        // But let's check explicitly.
        if (!leave.leaveType) {
            console.log(`Deleting orphaned leave request: ${leave.id} (Type ID: ${leave.leaveTypeId})`);
            await prisma.leaveRequest.delete({
                where: { id: leave.id }
            });
            deletedCount++;
        }
    }
    console.log(`Cleanup complete. Deleted ${deletedCount} orphaned records.`);
    // 2. Also check specifically for IDs that don't exist in LeaveType table
    // (Double check method)
    const allTypeIds = (await prisma.leaveType.findMany({ select: { id: true } })).map(t => t.id);
    const orphanedLeaves = await prisma.leaveRequest.findMany({
        where: {
            leaveTypeId: {
                notIn: allTypeIds
            }
        }
    });
    if (orphanedLeaves.length > 0) {
        console.log(`Found ${orphanedLeaves.length} leaves via direct FK check.`);
        const { count } = await prisma.leaveRequest.deleteMany({
            where: {
                leaveTypeId: {
                    notIn: allTypeIds
                }
            }
        });
        console.log(`Deleted ${count} leaves via batch delete.`);
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=cleanup-orphaned-leaves.js.map