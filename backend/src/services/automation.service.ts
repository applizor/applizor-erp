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
}

export type AutomationTrigger = 'TASK_STATUS_CHANGE' | 'TASK_CREATED' | 'TASK_ASSIGNED' | 'COMMENT_ADDED' | 'MENTION_FOUND';

export class AutomationService {

    /**
     * Entry point to check and run rules
     */
    static async evaluateRules(projectId: string, eventType: AutomationTrigger, payload: TriggerPayload) {
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

        switch (rule.triggerType) {
            case 'TASK_STATUS_CHANGE':
                if (config.from !== '*' && config.from !== payload.oldStatus) return false;
                if (config.to !== '*' && config.to !== payload.newStatus) return false;
                return true;

            case 'TASK_CREATED':
            case 'COMMENT_ADDED':
            case 'MENTION_FOUND':
                return true;

            case 'TASK_ASSIGNED':
                if (payload.assigneeId === payload.oldAssigneeId) return false;
                return true;

            default:
                return false;
        }
    }

    private static async executeAction(rule: any, payload: TriggerPayload) {
        const config = rule.actionConfig as any;
        const project = await prisma.project.findUnique({
            where: { id: payload.projectId },
            include: { client: true }
        });

        if (!project) return;

        // Resolve recipients
        let recipientEmails: string[] = [];
        if (config.recipient === 'assignee' && payload.assigneeEmail) {
            recipientEmails = [payload.assigneeEmail];
        } else if (config.recipient === 'client' && project.client?.email) {
            recipientEmails = [project.client.email];
        } else if (config.recipient === 'custom' && config.customEmail) {
            recipientEmails = [config.customEmail];
        } else if (config.recipient === 'mentions' && payload.mentions) {
            recipientEmails = payload.mentions.map(m => m.email);
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
                    await notifyTaskAssigned({ title: payload.taskTitle, description: '', priority: 'medium', status: payload.newStatus || 'todo', type: 'task' }, { email: payload.assigneeEmail, firstName: payload.assigneeName }, project);
                } else if (config.useTemplate === 'created') {
                    await notifyNewTask({ title: payload.taskTitle, description: '', priority: 'medium', type: 'task' }, project, email);
                } else {
                    await sendEmail(email, config.subject || `Update: ${payload.taskTitle}`, config.body || `Task ${payload.taskTitle} has been updated.`);
                }
            }
        }

        // ACTION: IN-APP NOTIFICATION
        if (rule.actionType === 'IN_APP_NOTIFICATION') {
            const userIdsToNotify: string[] = [];
            if (config.recipient === 'assignee' && payload.assigneeId) userIdsToNotify.push(payload.assigneeId);
            if (config.recipient === 'mentions' && payload.mentions) userIdsToNotify.push(...payload.mentions.map(m => m.id));

            for (const userId of userIdsToNotify) {
                await NotificationService.createNotification({
                    companyId: payload.companyId,
                    userId,
                    title: config.subject || 'Task Update',
                    message: config.body || `${payload.commenterName || 'Update'} in ${payload.taskTitle}`,
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
                            "text": config.body || `${payload.commenterName || 'System'} triggered this automation for **${payload.taskTitle}**`
                        }],
                        "potentialAction": [{
                            "@type": "OpenUri",
                            "name": "View Task",
                            "targets": [{ "os": "default", "uri": `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${payload.projectId}/tasks?taskId=${payload.taskId}` }]
                        }]
                    });
                } catch (e) {
                    console.error("Teams notification failed:", e);
                }
            }
        }

        // ACTION: SLACK NOTIFICATION
        if (rule.actionType === 'SLACK_NOTIFICATION') {
            const webhookUrl = config.customEmail || (project.settings as any)?.slackWebhookUrl;
            if (webhookUrl) {
                try {
                    await axios.post(webhookUrl, {
                        "text": `*${rule.name}* triggered in Project: *${project.name}*`,
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
                } catch (e) {
                    console.error("Slack notification failed:", e);
                }
            }
        }
    }
}
