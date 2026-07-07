import prisma from '../prisma/client';
import { sendEmail, notifyTaskAssigned, notifyTaskUpdated, notifyNewTask, notifyMention } from './email.service';
import { NotificationService } from './notification.service';
import axios from 'axios';

interface TriggerPayload {
    taskId: string;
    projectId: string;
    oldStatus?: string;
    newStatus?: string;
    taskTitle: string;
    assigneeEmail?: string;
    assigneeName?: string;
    assigneeId?: string;
    oldAssigneeId?: string;
    commentContent?: string;
    commenterName?: string;
    mentions?: Array<{ id: string, name: string, email: string, firstName: string }>;
    companyId: string;
    description?: string;
    creatorName?: string;
    priority?: string;
    type?: string;
}

export type AutomationTrigger = 'TASK_STATUS_CHANGE' | 'TASK_CREATED' | 'TASK_ASSIGNED' | 'COMMENT_ADDED' | 'MENTION_FOUND' | 'TASK_REMINDER';

export class AutomationService {

    /**
     * Entry point to check and run rules
     */
    static async evaluateRules(projectId: string, eventType: AutomationTrigger, payload: TriggerPayload) {
        try {
            const project = await prisma.project.findFirst({ where: { id: projectId, companyId: payload.companyId } });
            if (!project) return;

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
                    try {
                        await this.executeAction(rule, payload);
                        // Log execution success
                        await prisma.automationLog.create({
                            data: {
                                ruleId: rule.id,
                                status: 'success',
                                message: `Rule executed successfully via channel: ${rule.actionType}`,
                                details: { payload }
                            }
                        });
                    } catch (actionErr: any) {
                        console.error(`Automation Action Failed for Rule ${rule.id}:`, actionErr);
                        // Log execution failure
                        await prisma.automationLog.create({
                            data: {
                                ruleId: rule.id,
                                status: 'failed',
                                message: actionErr.message || String(actionErr),
                                details: { error: String(actionErr), payload }
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Automation Error:", error);
        }
    }

    private static async checkCondition(rule: any, payload: TriggerPayload): Promise<boolean> {
        const config = rule.triggerConfig as any;

        switch (rule.triggerType) {
            case 'TASK_STATUS_CHANGE':
                if (config.from !== '*' && config.from !== payload.oldStatus) return false;
                if (config.to !== '*' && config.to !== payload.newStatus) return false;
                break;

            case 'TASK_ASSIGNED':
                if (payload.assigneeId === payload.oldAssigneeId) return false;
                break;

            case 'TASK_CREATED':
            case 'COMMENT_ADDED':
            case 'MENTION_FOUND':
            case 'TASK_REMINDER':
                // Check event matching
                break;

            default:
                return false;
        }

        // Apply advanced filters (Priority & Task Type) if configured
        if (config.priority && config.priority !== '*' && config.priority !== payload.priority) {
            return false;
        }
        if (config.type && config.type !== '*' && config.type !== payload.type) {
            return false;
        }

        return true;
    }

    private static replaceVariables(text: string, payload: TriggerPayload, projectName: string): string {
        if (!text) return '';
        
        let result = text;
        const replacements: Record<string, string> = {
            '{{taskTitle}}': payload.taskTitle || '',
            '{{projectName}}': projectName || '',
            '{{assigneeName}}': payload.assigneeName || 'Unassigned',
            '{{oldStatus}}': payload.oldStatus || '',
            '{{newStatus}}': payload.newStatus || '',
            '{{commentContent}}': payload.commentContent || '',
            '{{commenterName}}': payload.commenterName || '',
            '{{creatorName}}': payload.creatorName || '',
            '{{taskDescription}}': payload.description || ''
        };

        for (const [key, value] of Object.entries(replacements)) {
            result = result.split(key).join(value);
        }
        return result;
    }

    public static async executeAction(rule: any, payload: TriggerPayload) {
        const config = rule.actionConfig as any;
        const project = await prisma.project.findFirst({
            where: { id: payload.projectId, companyId: payload.companyId },
            include: { client: true }
        });

        if (!project) return;

        // Resolve recipients
        let recipientEmails: string[] = [];
        let recipientUserIds: string[] = [];

        if (config.recipient === 'assignee') {
            if (payload.assigneeEmail) recipientEmails = [payload.assigneeEmail];
            if (payload.assigneeId) recipientUserIds = [payload.assigneeId];
        } else if (config.recipient === 'client' && project.client?.email) {
            if (project.client.receiveNotifications !== false) {
                recipientEmails = [project.client.email];
            } else {
                console.log(`ℹ️ Client ${project.client.name} has notifications disabled. Skipping automation email.`);
            }
        } else if (config.recipient === 'custom' && config.customEmail) {
            recipientEmails = [config.customEmail];
        } else if (config.recipient === 'mentions') {
            if (payload.mentions) {
                recipientEmails = payload.mentions.map(m => m.email);
                recipientUserIds = payload.mentions.map(m => m.id);
            }
        } else if (config.recipient === 'project_manager') {
            const managers = await prisma.projectMember.findMany({
                where: { projectId: payload.projectId, role: { in: ['manager', 'admin'] } },
                include: { employee: true }
            });
            recipientEmails = managers.map(m => m.employee.email).filter(Boolean);
            recipientUserIds = managers.map(m => m.employee.userId).filter((id): id is string => !!id);
        } else if (config.recipient === 'project_members') {
            const members = await prisma.projectMember.findMany({
                where: { projectId: payload.projectId },
                include: { employee: true }
            });
            recipientEmails = members.map(m => m.employee.email).filter(Boolean);
            recipientUserIds = members.map(m => m.employee.userId).filter((id): id is string => !!id);
        } else if (config.recipient === 'task_creator') {
            if (payload.taskId) {
                const task = await prisma.task.findUnique({
                    where: { id: payload.taskId },
                    include: { creator: { select: { email: true, id: true } } }
                });
                if (task?.creator) {
                    if (task.creator.email) recipientEmails = [task.creator.email];
                    recipientUserIds = [task.creator.id];
                }
            }
        }

        // ACTION: SEND EMAIL
        if (rule.actionType === 'SEND_EMAIL') {
            for (const email of recipientEmails) {
                if (config.useTemplate === 'mention' && payload.mentions) {
                    const mention = payload.mentions.find(m => m.email === email);
                    if (mention) {
                        await notifyMention({ email: mention.email, firstName: mention.firstName }, payload.commenterName || 'Someone', { title: payload.taskTitle, id: payload.taskId }, project, payload.commentContent || '');
                    }
                } else if (config.useTemplate === 'assigned') {
                    await notifyTaskAssigned(payload.assigneeEmail!, { title: payload.taskTitle, description: '', priority: 'medium', status: payload.newStatus || 'todo', type: 'task' }, project);
                } else if (config.useTemplate === 'created') {
                    await notifyNewTask(email, { title: payload.taskTitle, description: '', priority: 'medium', type: 'task' }, project);
                } else if (config.useTemplate === 'status') {
                    await notifyTaskUpdated({ firstName: payload.assigneeName || 'User', email: email }, { title: payload.taskTitle, id: payload.taskId, status: payload.newStatus || 'Updated' }, project, [`Status changed to ${payload.newStatus}`]);
                } else if (config.useTemplate === 'reminder' || rule.triggerType === 'TASK_REMINDER') {
                    const daysRemaining = (payload as any).daysRemaining ?? 0;
                    const { notifyTaskReminder } = require('./email.service');
                    await notifyTaskReminder(
                        email,
                        { title: payload.taskTitle, id: payload.taskId, priority: (payload as any).priority || 'medium', status: payload.newStatus || 'todo', dueDate: (payload as any).dueDate },
                        project,
                        daysRemaining
                    );
                } else {
                    const resolvedSubject = this.replaceVariables(config.subject || `Update: ${payload.taskTitle}`, payload, project.name);
                    const resolvedBody = this.replaceVariables(config.body || `Task ${payload.taskTitle} has been updated.`, payload, project.name);
                    
                    // HTML wrapped premium email structure
                    const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>${resolvedSubject}</title>
                        </head>
                        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                            <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 24px; background-color: #1e1b4b; text-align: left;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Applizor Softech ERP</h1>
                                        <span style="color: #818cf8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-top: 4px;">Smart Workflow Automation</span>
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 32px; color: #334155; font-size: 14px; line-height: 1.6;">
                                        <h2 style="margin-top: 0; margin-bottom: 20px; color: #0f172a; font-size: 16px; font-weight: 700;">Workflow Alert: ${rule.name}</h2>
                                        <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 6px; margin-bottom: 24px; white-space: pre-wrap; font-size: 14px; color: #1e293b;">${resolvedBody}</div>
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 12px; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b; font-weight: 600; text-transform: uppercase; width: 120px;">Project:</td>
                                                <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${project.name}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 4px 0; color: #64748b; font-weight: 600; text-transform: uppercase;">Task:</td>
                                                <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${payload.taskTitle}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px;">
                                        <p style="margin: 0; font-weight: 600;">This is an automated system notification.</p>
                                        <p style="margin: 4px 0 0 0;">Configure your rules inside Project > Settings > Automation.</p>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                    `;
                    await sendEmail(email, resolvedSubject, htmlContent);
                }
            }
        }

        // ACTION: IN-APP NOTIFICATION
        if (rule.actionType === 'IN_APP_NOTIFICATION') {
            const userIdsToNotify: string[] = [...recipientUserIds];

            for (const userId of userIdsToNotify) {
                const resolvedSubject = this.replaceVariables(config.subject || 'Task Update', payload, project.name);
                const resolvedBody = this.replaceVariables(config.body || `${payload.commenterName || 'Update'} in ${payload.taskTitle}`, payload, project.name);

                await NotificationService.createNotification({
                    companyId: payload.companyId,
                    userId,
                    title: resolvedSubject,
                    message: resolvedBody,
                    type: 'info',
                    link: `/projects/${payload.projectId}/tasks?taskId=${payload.taskId}`
                });
            }
        }

        // ACTION: TEAMS NOTIFICATION
        if (rule.actionType === 'TEAMS_NOTIFICATION') {
            const webhookUrl = config.customEmail || (project.settings as any)?.teamsWebhookUrl;
            if (webhookUrl) {
                try {
                    const resolvedBody = this.replaceVariables(config.body || `${payload.commenterName || 'System'} triggered this automation for **${payload.taskTitle}**`, payload, project.name);
                    await axios.post(webhookUrl, {
                        "@type": "MessageCard",
                        "@context": "http://schema.org/extensions",
                        "themeColor": "0076D7",
                        "summary": rule.name,
                        "sections": [{
                            "activityTitle": rule.name,
                            "activitySubtitle": `Project: ${project.name}`,
                            "facts": [
                                { "name": "Task", "value": payload.taskTitle },
                                { "name": "Event", "value": rule.triggerType },
                                { "name": "Assignee", "value": payload.assigneeName || 'Unassigned' }
                            ],
                            "markdown": true,
                            "text": resolvedBody
                        }],
                        "potentialAction": [{
                            "@type": "OpenUri",
                            "name": "View Task",
                            "targets": [{ "os": "default", "uri": `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${payload.projectId}/tasks?taskId=${payload.taskId}` }]
                        }]
                    });
                } catch (e: any) {
                    console.error("Teams notification failed:", e);
                    throw new Error(`Teams Webhook Error: ${e.message || String(e)}`);
                }
            } else {
                throw new Error("No Teams webhook configured");
            }
        }

        // ACTION: SLACK NOTIFICATION
        if (rule.actionType === 'SLACK_NOTIFICATION') {
            const webhookUrl = config.customEmail || (project.settings as any)?.slackWebhookUrl;
            if (webhookUrl) {
                try {
                    const resolvedText = this.replaceVariables(config.body || `*${rule.name}* triggered in Project: *${project.name}*`, payload, project.name);
                    await axios.post(webhookUrl, {
                        "text": resolvedText,
                        "attachments": [{
                            "color": "#36a64f",
                            "fields": [
                                { "title": "Task", "value": payload.taskTitle, "short": true },
                                { "title": "Event", "value": rule.triggerType, "short": true },
                                { "title": "Assignee", "value": payload.assigneeName || 'Unassigned', "short": true },
                                { "title": "Triggered By", "value": payload.commenterName || 'System', "short": true }
                            ],
                            "footer": "Applizor ERP Automation",
                            "actions": [{
                                "type": "button",
                                "text": "View Task",
                                "url": `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${payload.projectId}/tasks?taskId=${payload.taskId}`
                            }]
                        }]
                    });
                } catch (e: any) {
                    console.error("Slack notification failed:", e);
                    throw new Error(`Slack Webhook Error: ${e.message || String(e)}`);
                }
            } else {
                throw new Error("No Slack webhook configured");
            }
        }
    }
}
