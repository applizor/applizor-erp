import prisma from '../prisma/client';

export class HistoryService {

    /**
     * Records changes between old and new task state.
     * @param taskId Task ID
     * @param oldTask Previous task state (must include status, priority, assigneeId, etc.)
     * @param newTask New task data
     * @param actorId User ID or Client ID acting
     * @param actorType 'user' | 'client'
     */
    static async recordTaskChanges(
        taskId: string,
        oldTask: any,
        newTask: any,
        actorId: string,
        actorType: 'user' | 'client'
    ) {
        if (!oldTask) return;

        const changes: { field: string, oldValue: string, newValue: string }[] = [];

        // 1. Status
        if (newTask.status && oldTask.status !== newTask.status) {
            changes.push({ field: 'status', oldValue: oldTask.status, newValue: newTask.status });
        }

        // 2. Priority
        if (newTask.priority && oldTask.priority !== newTask.priority) {
            changes.push({ field: 'priority', oldValue: oldTask.priority, newValue: newTask.priority });
        }

        // 3. Assignee
        if (newTask.assignedToId !== undefined && oldTask.assignedToId !== newTask.assignedToId) { // undefined check important for partial updates
            // Ideally we want names, but ID is enough for history logic, UI can resolve it.
            // Or we can fetch names if needed. For now storing IDs or "Changed"
            changes.push({
                field: 'assignee',
                oldValue: oldTask.assignedToId || 'Unassigned',
                newValue: newTask.assignedToId || 'Unassigned'
            });
        }

        // 4. Description
        if (newTask.description && oldTask.description !== newTask.description) {
            // Don't store full text if huge? 
            changes.push({ field: 'description', oldValue: '', newValue: 'Updated Description' });
        }

        if (changes.length === 0) return;

        // Batch create history
        const userId = actorType === 'user' ? actorId : null;
        const clientId = actorType === 'client' ? actorId : null;

        await prisma.taskHistory.createMany({
            data: changes.map(change => ({
                taskId,
                userId,
                clientId,
                field: change.field,
                oldValue: change.oldValue,
                newValue: change.newValue
            }))
        });
    }
}
