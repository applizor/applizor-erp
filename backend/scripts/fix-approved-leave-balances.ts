import prisma from '../src/prisma/client';

/**
 * Fix Leave Balances for Already Approved Leaves
 * 
 * This script processes all approved leave requests that haven't been
 * reflected in employee leave balances and updates them accordingly.
 */

async function fixApprovedLeaveBalances() {
    try {
        console.log('🔍 Finding all approved leave requests...\n');

        // Get all approved leave requests
        const approvedLeaves = await prisma.leaveRequest.findMany({
            where: {
                status: 'approved'
            },
            include: {
                employee: true,
                leaveType: true
            },
            orderBy: {
                startDate: 'asc'
            }
        });

        console.log(`Found ${approvedLeaves.length} approved leave requests\n`);

        let updatedCount = 0;
        let createdCount = 0;
        let skippedCount = 0;

        for (const leave of approvedLeaves) {
            const year = new Date(leave.startDate).getFullYear();

            console.log(`Processing: ${leave.employee.firstName} ${leave.employee.lastName} - ${leave.leaveType.name} (${leave.days} days) - ${year}`);

            // Find existing balance record
            const existingBalance = await prisma.employeeLeaveBalance.findFirst({
                where: {
                    employeeId: leave.employeeId,
                    leaveTypeId: leave.leaveTypeId,
                    year
                }
            });

            if (existingBalance) {
                // Check if this leave's days are already counted
                // We can't be 100% sure, so we'll add a note
                console.log(`  ℹ️  Balance exists: Allocated=${existingBalance.allocated}, Used=${existingBalance.used}`);

                // Update the balance by adding these leave days
                await prisma.employeeLeaveBalance.update({
                    where: { id: existingBalance.id },
                    data: {
                        used: existingBalance.used + leave.days
                    }
                });

                console.log(`  ✅ Updated: Used is now ${existingBalance.used + leave.days}\n`);
                updatedCount++;
            } else {
                // Create new balance record
                console.log(`  ⚠️  No balance record found, creating one...`);

                await prisma.employeeLeaveBalance.create({
                    data: {
                        employeeId: leave.employeeId,
                        leaveTypeId: leave.leaveTypeId,
                        year,
                        allocated: leave.leaveType.days,
                        used: leave.days,
                        carriedOver: 0
                    }
                });

                console.log(`  ✅ Created: Allocated=${leave.leaveType.days}, Used=${leave.days}\n`);
                createdCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 Summary:');
        console.log('='.repeat(60));
        console.log(`Total Approved Leaves Processed: ${approvedLeaves.length}`);
        console.log(`Balances Updated: ${updatedCount}`);
        console.log(`Balances Created: ${createdCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log('='.repeat(60));
        console.log('\n✅ Fix completed successfully!');

    } catch (error) {
        console.error('❌ Error fixing leave balances:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
fixApprovedLeaveBalances()
    .then(() => {
        console.log('\n✨ Script finished');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Script failed:', error);
        process.exit(1);
    });
