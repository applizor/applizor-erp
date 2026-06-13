import { BAService } from './ba.service';
import { AIService } from './ai.service';
import { AssignmentService } from './assignment.service';
import { ConversationMemoryService } from './conversation_memory.service';

export class CompanyOSCoordinator {
    /**
     * The "Golden Path" orchestrator.
     * Processes a raw client message through the entire AI Company OS pipeline.
     */
    static async processClientRequest(clientMessage: string, clientContext: string, userId: string) {
        console.log(`🚀 Orchestrating request: "${clientMessage}"`);

        try {
            // STEP 1: Business Analysis
            // Transforms raw message into structured requirements.
            console.log('--- Step 1: Analyzing Request (BA) ---');
            const baResult = await BAService.analyzeClientMessage(clientMessage, clientContext);
            if (!baResult.success) {
                return { 
                    success: false, 
                    stage: 'BUSINESS_ANALYSIS', 
                    error: baResult.error 
                };
            }
            const analysis = baResult.analysis;
            if (!analysis) {
                return { success: false, stage: 'BUSINESS_ANALYSIS', error: 'Analysis result was empty' };
            }
            console.log(`✅ Analysis complete. Module: ${analysis.affectedModule}, Priority: ${analysis.priority}`);

            // STEP 2: Task Creation & Verification
            // Creates the actual record in the ERP.
            console.log('--- Step 2: Creating ERP Task ---');
            const taskData = {
                title: `[${analysis.affectedModule}] ${analysis.summary}`,
                description: `Client Request: ${clientMessage}\n\nBA Analysis:\n- Complexity: ${analysis.complexity}\n- Priority: ${analysis.priority}\n- Risks: ${analysis.risks.join(', ')}`,
                priority: analysis.priority.toLowerCase(),
                status: 'todo',
                projectId: 'PRJ-001' // In a real scenario, this would be dynamically resolved from clientContext
            };
            
            const taskResult = await AIService.createVerifiedTask(taskData, userId);
            if (!taskResult.success || !taskResult.task) {
                return { 
                    success: false, 
                    stage: 'TASK_CREATION', 
                    error: taskResult.error || 'Task creation failed or returned no task',
                    analysis 
                };
            }
            const taskId = taskResult.task.id;
            console.log(`✅ Task ${taskId} created and verified.`);

            // STEP 3: Resource Assignment
            // Finds the best employee based on skills and workload.
            console.log('--- Step 3: Assigning Best Resource ---');
            const assignRecResult = await AssignmentService.recommendAssignee(
                analysis.requiredSkills, 
                analysis.affectedModule
            );

            if (!assignRecResult.success) {
                return { 
                    success: false, 
                    stage: 'ASSIGNMENT_RECOMMENDATION', 
                    error: assignRecResult.message,
                    taskId,
                    analysis
                };
            }

            const employeeId = assignRecResult.recommendation!.employeeId;
            
            // Now perform the actual verified assignment in the ERP
            const assignResult = await AssignmentService.assignTask(taskId, employeeId);
            if (!assignResult.success) {
                return { 
                    success: false, 
                    stage: 'TASK_ASSIGNMENT', 
                    error: assignResult.error,
                    taskId,
                    analysis
                };
            }
            console.log(`✅ Task ${taskId} assigned to ${assignRecResult.recommendation!.name}.`);

            // STEP 4: Conversation Memory
            // Log the entire flow for future AI context.
            console.log('--- Step 4: Logging to Memory ---');
            await ConversationMemoryService.storeMessage({
                source: 'CompanyOS_Coordinator',
                externalId: `flow-${Date.now()}`,
                sender: 'System Orchestrator',
                content: `Processed client request: "${clientMessage}". Result: Created Task ${taskId} and assigned to ${assignRecResult.recommendation!.name}.`,
                timestamp: new Date(),
                projectId: 'PRJ-001'
            });

            // FINAL RESPONSE
            return {
                success: true,
                flow: {
                    analysis,
                    task: {
                        id: taskId,
                        title: taskData.title
                    },
                    assignee: {
                        id: employeeId,
                        name: assignRecResult.recommendation!.name,
                        reason: assignRecResult.recommendation!.reason
                    }
                },
                message: 'The client request has been successfully processed through the AI Company OS pipeline.'
            };

        } catch (error: any) {
            console.error(`Orchestration Critical Error: ${error}`);
            return {
                success: false,
                stage: 'ORCHESTRATION_CRITICAL',
                error: error.message || 'An unexpected error occurred during orchestration'
            };
        }
    }
}
