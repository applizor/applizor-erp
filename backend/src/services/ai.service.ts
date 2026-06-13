import prisma from '../prisma/client';
import { VerificationService } from './verification.service';
import axios from 'axios';

export class AIService {
    /**
     * Generic method to generate text from a prompt using Gemini.
     */
    static async generateText(prompt: string) {
        try {
            const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY, {
                contents: [{ parts: [{ text: prompt }] }]
            });

            const text = response.data.candidates[0].content.parts[0].text;
            // Remove markdown code blocks if present
            return text.replace(/```json|```/g, '').trim();
        } catch (error: any) {
            console.error(`AI generateText Error: ${error}`);
            throw new Error('Failed to generate AI text response');
        }
    }

    static async generateTask(details: any) {
        const prompt = `Generate a professional task description for: ${details.title}. Details: ${details.description}`;
        return this.generateText(prompt);
    }

    static async rewriteHeadline(headline: string) {
        const prompt = `Rewrite this headline to be more professional and catchy: ${headline}`;
        return this.generateText(prompt);
    }

    static async generateSEOMetadata(pageContent: string) {
        const prompt = `Generate SEO meta title and description for this content: ${pageContent}. Return JSON.`;
        return this.generateText(prompt);
    }

    static async generateSummary(text: string) {
        const prompt = `Summarize the following text concisely: ${text}`;
        return this.generateText(prompt);
    }

    // --- Verified Action Layer (Chief of Staff Verification) ---

    /**
     * Creates a task in the ERP and verifies its existence.
     * This prevents the AI from hallucinating a successful task creation.
     */
    static async createVerifiedTask(taskData: any, userId: string) {
        try {
            const task = await prisma.task.create({
                data: {
                    ...taskData,
                    createdById: userId
                }
            });

            const verification = await VerificationService.verifyAction('TASK_CREATED', { taskId: task.id });
            
            if (!verification.success) {
                throw new Error(`Verification Failed: ${verification.message}`);
            }

            return {
                success: true,
                task,
                message: verification.message
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to create verified task',
                message: 'Action failed verification.'
            };
        }
    }

    /**
     * Assigns a task to an employee and verifies the assignment.
     */
    static async assignVerifiedTask(taskId: string, employeeId: string) {
        try {
            await prisma.task.update({
                where: { id: taskId },
                data: { assignedToId: employeeId }
            });

            const verification = await VerificationService.verifyAction('TASK_ASSIGNED', { taskId, employeeId });

            if (!verification.success) {
                throw new Error(`Verification Failed: ${verification.message}`);
            }

            return {
                success: true,
                message: verification.message
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to assign verified task',
                message: 'Action failed verification.'
            };
        }
    }

    /**
     * Verifies the existence of a resource (Employee or Project) before AI proceeds.
     */
    static async verifyResource(type: 'EMPLOYEE' | 'PROJECT', id: string) {
        const action = type === 'EMPLOYEE' ? 'EMPLOYEE_VERIFIED' : 'PROJECT_VERIFIED';
        const params = type === 'EMPLOYEE' ? { employeeId: id } : { projectId: id };
        
        const verification = await VerificationService.verifyAction(action, params);
        return verification;
    }
}
