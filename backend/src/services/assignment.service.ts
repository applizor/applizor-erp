import prisma from '../prisma/client';
import { WorkloadService } from './workload.service';

export class AssignmentService {
    /**
     * Recommends the best employee for a task based on skills, workload, and availability.
     * @param requiredSkills Array of skills needed for the task.
     * @param taskType The type of task (e.g., 'backend', 'frontend', 'qa').
     */
    static async recommendAssignee(requiredSkills: string[], taskType: string) {
        try {
            // 1. Find all active employees
            const employees = await prisma.employee.findMany({
                where: { status: 'active' },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    positionId: true,
                    skills: true
                }
            });

            // Manually filter employees who have at least one of the required skills
            const candidates = employees.filter(emp => {
                const empSkills = (emp.skills as string[]) || [];
                return requiredSkills.some(skill => empSkills.includes(skill));
            });

            if (candidates.length === 0) {
                return {
                    success: false,
                    message: 'No qualified employees found with the required skills.',
                    recommendation: null
                };
            }

            // 2. Analyze workload and availability for all candidates
            const analyzedCandidates = await Promise.all(candidates.map(async (emp) => {
                const workload = await WorkloadService.calculateEmployeeWorkload(emp.id);
                return {
                    ...emp,
                    workloadScore: workload.score,
                    status: workload.details.status
                };
            }));

            // 3. Filter out unavailable employees (e.g., on leave)
            const availableCandidates = analyzedCandidates.filter(c => c.status !== 'unavailable');

            if (availableCandidates.length === 0) {
                return {
                    success: false,
                    message: 'Qualified employees found, but all are currently unavailable (on leave).',
                    recommendation: null
                };
            }

            // 4. Pick the candidate with the lowest workload score
            availableCandidates.sort((a, b) => a.workloadScore - b.workloadScore);
            const bestCandidate = availableCandidates[0];

            // 5. Construct the reason
            const reason = `Recommended because they possess the required skills (${requiredSkills.join(', ')}) and currently have the lowest workload (${bestCandidate.workloadScore}%) among available qualified developers.`;

            return {
                success: true,
                recommendation: {
                    employeeId: bestCandidate.id,
                    name: `${bestCandidate.firstName} ${bestCandidate.lastName}`,
                    workloadScore: bestCandidate.workloadScore,
                    reason: reason
                }
            };
        } catch (error) {
            console.error(`Assignment Engine Error: ${error}`);
            throw new Error('Failed to find best assignee');
        }
    }

    /**
     * Performs the actual assignment of a task in the ERP and verifies it.
     * This integrates with the VerificationService logic.
     */
    static async assignTask(taskId: string, employeeId: string) {
        try {
            // Use the already implemented verified assignment logic from AIService/VerificationService
            // To avoid duplication, we can just call the prisma update here and then verify.
            await prisma.task.update({
                where: { id: taskId },
                data: { assignedToId: employeeId }
            });

            // Verification step
            const task = await prisma.task.findUnique({
                where: { id: taskId },
                select: { assignedToId: true }
            });

            if (task?.assignedToId !== employeeId) {
                throw new Error('Assignment verification failed: Task not updated in ERP.');
            }

            return {
                success: true,
                message: 'Task successfully assigned and verified in ERP.'
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Assignment failed'
            };
        }
    }
}
