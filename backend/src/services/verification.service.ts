import prisma from '../prisma/client';

export class VerificationService {
    /**
     * Verify if a task exists in the ERP.
     */
    static async verifyTaskExists(taskId: string): Promise<boolean> {
        try {
            const task = await prisma.task.findUnique({
                where: { id: taskId },
                select: { id: true }
            });
            return !!task;
        } catch (error) {
            console.error(`Verification Error (verifyTaskExists): ${error}`);
            return false;
        }
    }

    /**
     * Verify if a project exists in the ERP.
     */
    static async verifyProjectExists(projectId: string): Promise<boolean> {
        try {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { id: true }
            });
            return !!project;
        } catch (error) {
            console.error(`Verification Error (verifyProjectExists): ${error}`);
            return false;
        }
    }

    /**
     * Verify if an employee exists in the ERP.
     */
    static async verifyEmployeeExists(employeeId: string): Promise<boolean> {
        try {
            const employee = await prisma.employee.findUnique({
                where: { id: employeeId },
                select: { id: true }
            });
            return !!employee;
        } catch (error) {
            console.error(`Verification Error (verifyEmployeeExists): ${error}`);
            return false;
        }
    }

    /**
     * Verify if a specific employee is assigned to a specific task.
     */
    static async verifyTaskAssignment(taskId: string, employeeId: string): Promise<boolean> {
        try {
            const task = await prisma.task.findUnique({
                where: { id: taskId },
                select: { assignedToId: true }
            });
            return task?.assignedToId === employeeId;
        } catch (error) {
            console.error(`Verification Error (verifyTaskAssignment): ${error}`);
            return false;
        }
    }

    /**
     * Generic verification engine to prevent AI hallucinations.
     * @param action The action type ('TASK_CREATED', 'TASK_ASSIGNED', 'EMPLOYEE_VERIFIED', 'PROJECT_VERIFIED')
     * @param params Parameters for verification (e.g., { taskId, employeeId, projectId })
     */
    static async verifyAction(action: 'TASK_CREATED' | 'TASK_ASSIGNED' | 'EMPLOYEE_VERIFIED' | 'PROJECT_VERIFIED', params: any): Promise<{ success: boolean, message: string }> {
        switch (action) {
            case 'TASK_CREATED':
                if (!params.taskId) return { success: false, message: 'Task ID missing for verification.' };
                const taskExists = await this.verifyTaskExists(params.taskId);
                return taskExists 
                    ? { success: true, message: 'Task creation verified in ERP.' }
                    : { success: false, message: 'Task creation failed: Task not found in ERP.' };

            case 'TASK_ASSIGNED':
                if (!params.taskId || !params.employeeId) return { success: false, message: 'Task ID or Employee ID missing for verification.' };
                const isAssigned = await this.verifyTaskAssignment(params.taskId, params.employeeId);
                return isAssigned 
                    ? { success: true, message: 'Task assignment verified in ERP.' }
                    : { success: false, message: 'Task assignment failed: Employee not assigned to task in ERP.' };

            case 'EMPLOYEE_VERIFIED':
                if (!params.employeeId) return { success: false, message: 'Employee ID missing for verification.' };
                const empExists = await this.verifyEmployeeExists(params.employeeId);
                return empExists 
                    ? { success: true, message: 'Employee record verified in ERP.' }
                    : { success: false, message: 'Employee verification failed: Record not found in ERP.' };

            case 'PROJECT_VERIFIED':
                if (!params.projectId) return { success: false, message: 'Project ID missing for verification.' };
                const projExists = await this.verifyProjectExists(params.projectId);
                return projExists 
                    ? { success: true, message: 'Project record verified in ERP.' }
                    : { success: false, message: 'Project verification failed: Record not found in ERP.' };

            default:
                return { success: false, message: 'Unsupported verification action.' };
        }
    }
}
