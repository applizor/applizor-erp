import { BAService } from '../services/ba.service';
import { AIService } from '../services/ai.service';
import { AssignmentService } from '../services/assignment.service';
import { ConversationMemoryService } from '../services/conversation_memory.service';

export class E2EFlowTest {
    static async runTest() {
        console.log('🚀 Starting End-to-End Flow Test...\n');

        const clientMessage = "I want to integrate Stripe payment gateway into my POS system. It should support recurring subscriptions.";
        const clientContext = "Client: Acme Corp | Project: Retail POS v2";
        const adminUserId = 'admin-123'; // Mock Admin User

        try {
            // STEP 1: Business Analysis
            console.log('Step 1: Business Analysis...');
            const baResult = await BAService.analyzeClientMessage(clientMessage, clientContext);
            if (!baResult.success) throw new Error(`BA failed: ${baResult.error}`);
            const analysis = baResult.analysis;
            console.log('✅ Analysis Complete:', analysis?.summary || 'No summary available');
            console.log(`   Module: ${analysis?.affectedModule || 'N/A'} | Priority: ${analysis?.priority || 'N/A'} | Skills: ${analysis?.requiredSkills?.join(', ') || 'None'}`);

            // STEP 2: ERP Task Creation
            console.log('\nStep 2: Creating ERP Task...');
            const taskData = {
                title: `Implement ${analysis?.affectedModule || 'Module'} feature: ${analysis?.summary || 'Task'}`,
                description: `Client Request: ${clientMessage}. Analysis: ${JSON.stringify(analysis)}`,
                priority: (analysis?.priority || 'medium').toLowerCase(),
                status: 'todo',
                projectId: 'PRJ-001'
            };
            const taskResult = await AIService.createVerifiedTask(taskData, adminUserId);
            if (!taskResult.success || !taskResult.task) throw new Error(`Task creation failed: ${taskResult.error}`);
            const taskId = taskResult.task!.id;
            console.log(`✅ Task Created & Verified in ERP: ${taskId}`);

            // STEP 3: Assignment Recommendation
            console.log('\nStep 3: Recommending Assignee...');
            const recResult = await AssignmentService.recommendAssignee(
                analysis?.requiredSkills || [], 
                analysis?.affectedModule || 'General'
            );
            if (!recResult.success) throw new Error(`Recommendation failed: ${recResult.message}`);
            const assigneeId = recResult.recommendation!.employeeId;
            console.log(`✅ Recommended: ${recResult.recommendation!.name} | Reason: ${recResult.recommendation!.reason}`);

            // STEP 4: Developer Assignment
            console.log('\nStep 4: Assigning Developer...');
            const assignResult = await AssignmentService.assignTask(taskId, assigneeId);
            if (!assignResult.success) throw new Error(`Assignment failed: ${assignResult.error}`);
            console.log(`✅ Task ${taskId} assigned to ${assigneeId} and verified.`);

            // STEP 5: Conversation Memory
            console.log('\nStep 5: Storing in Conversation Memory...');
            const memResult = await ConversationMemoryService.storeMessage({
                source: 'Internal AI flow',
                externalId: `flow-${Date.now()}`,
                sender: 'AI System',
                content: `Processed request: ${clientMessage}. Task ${taskId} assigned to ${assigneeId}.`,
                timestamp: new Date()
            });
            if (!memResult.success) throw new Error(`Memory storage failed: ${memResult.error}`);
            console.log(`✅ Flow logged in Conversation Memory. Links: ${JSON.stringify(memResult.links)}`);

            console.log('\n✨ END-TO-END FLOW TEST SUCCESSFUL ✨');
            return {
                success: true,
                taskId,
                assigneeId,
                analysis
            };

        } catch (error: any) {
            console.error('\n❌ E2E TEST FAILED:');
            console.error(error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}
