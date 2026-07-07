import prisma from '../prisma/client';

/**
 * Simple string hash to 32-bit signed integer.
 * Ensures consistent lock keys across replicas.
 */
function hashStringToInt32(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export class CronLockService {
    /**
     * Executes the provided async function only if it can acquire the PostgreSQL transaction-level advisory lock.
     * Transaction-level locks are automatically released at the end of the transaction.
     * Running inside a transaction forces Prisma to hold a dedicated connection, ensuring lock exclusivity.
     */
    static async withCronLock<T>(lockKey: string, fn: () => Promise<T>): Promise<T | null> {
        const lockId = hashStringToInt32(lockKey);
        
        try {
            // We use Prisma transaction to lock a dedicated connection for this task
            return await prisma.$transaction(async (tx) => {
                const result = await tx.$queryRawUnsafe<{ acquired: boolean }[]>(
                    `SELECT pg_try_advisory_xact_lock(${lockId}) as acquired`
                );
                
                const isAcquired = result[0]?.acquired ?? false;
                
                if (!isAcquired) {
                    console.log(`[CronLock] Skipping task "${lockKey}" - lock already held by another replica.`);
                    return null;
                }
                
                console.log(`[CronLock] Acquired transaction lock for task "${lockKey}" (lockId: ${lockId})`);
                const output = await fn();
                console.log(`[CronLock] Finished execution. Releasing transaction lock for task "${lockKey}"`);
                return output;
            }, {
                timeout: 60000 // 60 seconds transaction timeout for background tasks
            });
        } catch (error) {
            console.error(`[CronLock] Error executing task "${lockKey}" under transaction lock:`, error);
            throw error;
        }
    }
}
