import { leaveAccrualService } from '../src/services/leave-accrual.service';
import prisma from '../src/prisma/client';

/**
 * Script to run monthly leave accrual manually or via cron
 */
async function run() {
    try {
        await leaveAccrualService.processMonthlyAccruals();
        console.log('✅ Accrual process completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Accrual process failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

run();
