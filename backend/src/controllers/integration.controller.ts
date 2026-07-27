import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../prisma/client';
import { SlackService } from '../services/slack.service';
import { TeamsService } from '../services/teams.service';

export const handleSlackWebhook = async (req: AuthRequest, res: Response) => {
    try {
        const { type, event } = req.body;

        if (type === 'url_verification') {
            return res.json({ challenge: req.body.challenge });
        }

        if (type === 'event_callback') {
            if (event.type === 'message') {
                await SlackService.processMessage(event);
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Slack Webhook Error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

export const handleTeamsWebhook = async (req: AuthRequest, res: Response) => {
    try {
        const body = req.body;

        // Handle Power Automate / Workflows format
        if (body?.message?.text || body?.['body']?.['content'] || body?.text) {
            await TeamsService.processMessage(body);
            return res.sendStatus(200);
        }

        // Handle native Teams webhook
        if (body.validationToken) {
            return res.send(body.validationToken);
        }

        if (body.type === 'message') {
            await TeamsService.processMessage(body);
            return res.sendStatus(200);
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Teams Webhook Error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

export const replyToSlack = async (req: AuthRequest, res: Response) => {
    try {
        const { thread_ts, text } = req.body;
        const result = await SlackService.postMessage(thread_ts, text);
        res.json(result);
    } catch (error) {
        console.error('Slack Reply Error:', error);
        res.status(500).json({ error: 'Failed to reply to Slack' });
    }
};

export const replyToTeams = async (req: AuthRequest, res: Response) => {
    try {
        const { messageId, text } = req.body;
        const result = await TeamsService.replyToMessage(messageId, text);
        res.json(result);
    } catch (error) {
        console.error('Teams Reply Error:', error);
        res.status(500).json({ error: 'Failed to reply to Teams' });
    }
};

export const getProjectIntegration = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const integrations = await prisma.projectIntegration.findMany({
            where: { projectId }
        });
        res.json(integrations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch integrations' });
    }
};

export const saveProjectIntegration = async (req: AuthRequest, res: Response) => {
    try {
        const { projectId } = req.params;
        const { provider, externalChannelId, settings } = req.body;

        const integration = await prisma.projectIntegration.upsert({
            where: { projectId_provider: { projectId, provider } },
            update: { externalChannelId, settings },
            create: { projectId, provider, externalChannelId, settings }
        });

        res.json(integration);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save integration' });
    }
};