import prisma from '../prisma/client';
// import { sendEmail } from './email.service'; // We will use this later

interface TriggerPayload {
    taskId: string;
    projectId: string;
    oldStatus?: string;
    newStatus?: string;
    taskTitle: string;
    assigneeEmail?: string;
}

export class AutomationService {

    /**
     * Entry point to check and run rules
     */
    static async evaluateRules(projectId: string, eventType: 'TASK_STATUS_CHANGE' | 'TASK_CREATED', payload: TriggerPayload) {
        try {
            // 1. Fetch active rules for this project and event type
            const rules = await prisma.automationRule.findMany({
                where: {
                    projectId,
                    triggerType: eventType,
                    isActive: true
                }
            });

            if (rules.length === 0) return;

            // 2. Evaluate each rule
            for (const rule of rules) {
                if (await this.checkCondition(rule, payload)) {
                    await this.executeAction(rule, payload);
                }
            }
        } catch (error) {
            console.error("Automation Error:", error);
        }
    }

    private static async checkCondition(rule: any, payload: TriggerPayload): Promise<boolean> {
        const config = rule.triggerConfig as any;

        // STATUS CHANGE CHECK
        if (rule.triggerType === 'TASK_STATUS_CHANGE') {
            // Check 'From' status (wildcard '*' means any)
            if (config.from !== '*' && config.from !== payload.oldStatus) return false;
            // Check 'To' status
            if (config.to !== payload.newStatus) return false;

            return true;
        }

        // TASK CREATED CHECK
        if (rule.triggerType === 'TASK_CREATED') {
            return true; // Simple trigger, always true if event matched
        }

        return false;
    }

    private static async executeAction(rule: any, payload: TriggerPayload) {
        const config = rule.actionConfig as any;

        if (rule.actionType === 'SEND_EMAIL') {
            let recipientEmail = '';

            // Resolve Recipient
            if (config.recipient === 'assignee') {
                recipientEmail = payload.assigneeEmail || '';
            } else if (config.recipient === 'client') {
                // Fetch project client
                const project = await prisma.project.findUnique({
                    where: { id: payload.projectId },
                    include: { client: { select: { email: true } } }
                });
                recipientEmail = project?.client?.email || '';
            } else if (config.recipient === 'custom') {
                recipientEmail = config.customEmail;
            }

            if (!recipientEmail) {
                console.log(`[Automation] Skipped: No recipient found for rule ${rule.name}`);
                return;
            }

            // In a real app, use email.service. For now, we mock/log or use a simple Stub
            console.log(`[Automation] 📧 Sending Email to ${recipientEmail}`);
            console.log(`Subject: ${config.subject || 'Notification'}`);
            console.log(`Body: ${config.body || `Task ${payload.taskTitle} updated.`}`);

            // await sendEmail(recipientEmail, config.subject, config.body);
        }
    }
}
