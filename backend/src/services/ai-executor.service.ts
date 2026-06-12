import fs from 'fs';
import prisma from '../prisma/client';
import { GeminiService } from './gemini.service';

export class AiExecutorService {
    private static companyProfilePath = 'f:\\applizor-ai-company-os\\config\\company_profile.md';

    /**
     * Load company profile grounding context
     */
    private static getCompanyProfile(): string {
        try {
            if (fs.existsSync(this.companyProfilePath)) {
                return fs.readFileSync(this.companyProfilePath, 'utf8');
            }
        } catch (error) {
            console.error('Error loading company profile for context:', error);
        }
        return 'Company: Applizor Softech LLP';
    }

    /**
     * Execute a CEO natural language command
     */
    static async executeCommand(query: string, companyId: string): Promise<string> {
        const companyProfile = this.getCompanyProfile();
        let databaseFacts = '';
        const lowercaseQuery = query.toLowerCase();

        try {
            if (lowercaseQuery.includes('project')) {
                // Fetch projects from DB
                const projects = await prisma.project.findMany({
                    where: { companyId },
                    select: { id: true, name: true, status: true, budget: true, startDate: true, endDate: true }
                });
                databaseFacts += `### Live Projects Database:\n${JSON.stringify(projects, null, 2)}\n\n`;
            }

            if (lowercaseQuery.includes('task')) {
                // Fetch tasks from DB (delayed, pending or general depending on keyword)
                let tasks;
                if (lowercaseQuery.includes('delayed') || lowercaseQuery.includes('overdue')) {
                    tasks = await prisma.task.findMany({
                        where: {
                            project: { companyId },
                            status: { notIn: ['completed', 'done'] },
                            dueDate: { lt: new Date() }
                        },
                        select: { id: true, title: true, status: true, dueDate: true, priority: true, projectId: true, assignedToId: true }
                    });
                } else {
                    tasks = await prisma.task.findMany({
                        where: { project: { companyId } },
                        take: 50,
                        select: { id: true, title: true, status: true, dueDate: true, priority: true, projectId: true }
                    });
                }
                databaseFacts += `### Live Tasks Database:\n${JSON.stringify(tasks, null, 2)}\n\n`;
            }

            if (lowercaseQuery.includes('employee') || lowercaseQuery.includes('workload') || lowercaseQuery.includes('staff')) {
                // Fetch employees and their active tasks
                const employees = await prisma.employee.findMany({
                    where: { companyId },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        department: { select: { name: true } }
                    }
                });

                // Count open tasks for each
                const workloadMap = [];
                for (const emp of employees) {
                    // Find user mapped to employee if relations exist, or count tasks assigned
                    const openTaskCount = await prisma.task.count({
                        where: {
                            assignedToId: emp.id, // check standard mappings
                            status: { notIn: ['completed', 'done'] }
                        }
                    });
                    workloadMap.push({
                        name: `${emp.firstName} ${emp.lastName}`,
                        department: emp.department?.name || 'N/A',
                        activeTasksCount: openTaskCount
                    });
                }

                databaseFacts += `### Live Employee Workload Summary:\n${JSON.stringify(workloadMap, null, 2)}\n\n`;
            }

            if (lowercaseQuery.includes('approval') || lowercaseQuery.includes('pending')) {
                // Fetch pending AI approvals
                const approvals = await prisma.aiApproval.findMany({
                    where: { companyId, status: 'pending' }
                });
                databaseFacts += `### Live Pending AI Approvals:\n${JSON.stringify(approvals, null, 2)}\n\n`;
            }

            // Fallback: If no explicit entity matched, fetch a high-level summary of company projects and pending approvals
            if (!databaseFacts) {
                const projectCounts = await prisma.project.count({ where: { companyId } });
                const taskCounts = await prisma.task.count({ where: { project: { companyId } } });
                const approvalCounts = await prisma.aiApproval.count({ where: { companyId, status: 'pending' } });
                
                databaseFacts += `### High Level Enterprise Counts:\n- Total Projects: ${projectCounts}\n- Total Tasks: ${taskCounts}\n- Pending AI Approvals: ${approvalCounts}\n\n`;
            }

        } catch (error: any) {
            console.error('Error fetching database facts for AI executor:', error);
            databaseFacts += `[Database Query Warning: Unable to fetch live context. Details: ${error.message}]\n\n`;
        }

        // System prompt defining strict chief of staff behavior
        const systemInstruction = `
You are the Chief of Staff agent for Applizor Softech LLP, representing the ERP Control center of CEO Arun Kumar.
Your primary role is to act as an executive assistant, answering operational business queries using ONLY verified database facts.

RULES:
1. Ground your answers 100% in the provided "Live Database" sections and the "Company Profile".
2. If the database facts show empty lists, explicitly state that no entries are matching. Do not hallucinate or invent records.
3. Keep responses concise, professional, and formatted in markdown tables/bullet points where appropriate.
4. Output a summary containing "Facts", "Source" (state that it comes from local ERP PostgreSQL tables), "Confidence Score" (100% if based on DB, lower if database query failed), and "Next Actions".
`;

        const prompt = `
=== COMPANY PROFILE ===
${companyProfile}

=== LIVE DATABASE CONTEXT ===
${databaseFacts}

=== CEO INSTRUCTION ===
"${query}"

Please process the CEO instruction using the database context and return a clean, executive operational response.
`;

        return await GeminiService.generateText(prompt, systemInstruction);
    }
}
