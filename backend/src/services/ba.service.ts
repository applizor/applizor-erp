import { AIService } from './ai.service';
import { AssignmentService } from './assignment.service';

export interface BAAnalysis {
    summary: string;
    affectedModule: string;
    complexity: 'Low' | 'Medium' | 'High';
    priority: 'Low' | 'Medium' | 'High';
    suggestedDepartment: string;
    requiredSkills: string[];
    suggestedAssignee: {
        employeeId: string;
        name: string;
        reason: string;
    } | null;
    risks: string[];
}

export class BAService {
    /**
     * Analyzes a client message and breaks it down into a structured business requirement.
     * @param clientMessage The raw message received from the client.
     * @param clientContext Additional context about the client (e.g., project name, current modules).
     */
    static async analyzeClientMessage(clientMessage: string, clientContext: string = 'General Project') {
        try {
            // 1. Define the prompt for the LLM to act as a Business Analyst
            const prompt = `
                You are a Professional Business Analyst for Applizor Softech. 
                Your task is to analyze the following client message and extract structured requirements.

                Client Context: ${clientContext}
                Client Message: "${clientMessage}"

                You must return the response in STRICT JSON format with the following keys:
                - summary: A concise 1-2 sentence summary of the request.
                - affectedModule: The specific ERP module affected (e.g., 'Inventory', 'POS', 'HRMS', 'Finance', 'CRM').
                - complexity: 'Low', 'Medium', or 'High'.
                - priority: 'Low', 'Medium', or 'High'.
                - suggestedDepartment: The department that should handle this (e.g., 'Engineering', 'Sales', 'HR', 'Finance').
                - requiredSkills: An array of technical skills needed to implement this (e.g., ['NodeJS', 'React', 'PostgreSQL', 'API Design']).
                - risks: An array of potential risks or dependencies.

                Do not include any markdown formatting like \`\`\`json. Return ONLY the raw JSON.
            `;

            // 2. Call the AI Service to generate the analysis
            // We reuse a generic generate method from AIService or call the LLM directly.
            // For now, I'll assume we use a prompt-based generation.
            const aiResponse = await AIService.generateText(prompt);
            
            let analysis: any;
            try {
                analysis = JSON.parse(aiResponse);
            } catch (e) {
                throw new Error('AI returned invalid JSON format for BA analysis.');
            }

            // 3. Intelligent Assignment: Use the Assignment Engine to find a real person
            let recommendedAssignee = null;
            if (analysis.requiredSkills && analysis.requiredSkills.length > 0) {
                const assignment = await AssignmentService.recommendAssignee(
                    analysis.requiredSkills, 
                    analysis.affectedModule
                );

                if (assignment.success) {
                    recommendedAssignee = {
                        employeeId: assignment.recommendation!.employeeId,
                        name: assignment.recommendation!.name,
                        reason: assignment.recommendation!.reason
                    };
                }
            }

            // 4. Construct the final BAAnalysis object
            const finalAnalysis: BAAnalysis = {
                summary: analysis.summary,
                affectedModule: analysis.affectedModule,
                complexity: analysis.complexity,
                priority: analysis.priority,
                suggestedDepartment: analysis.suggestedDepartment,
                requiredSkills: analysis.requiredSkills,
                suggestedAssignee: recommendedAssignee,
                risks: analysis.risks
            };

            return {
                success: true,
                analysis: finalAnalysis
            };

        } catch (error: any) {
            console.error(`BA Service Error: ${error}`);
            return {
                success: false,
                error: error.message || 'Failed to analyze client message'
            };
        }
    }
}
