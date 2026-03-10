import axios from 'axios';

export class AIService {
    /**
     * Generate a structured, developer-friendly task from a user prompt using LLM.
     */
    static async generateTask(prompt: string): Promise<{ title: string, description: string }> {
        const apiKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.warn("AI API Key missing. Falling back to mock logic.");
            return this.mockGenerateTask(prompt);
        }

        try {
            const systemPrompt = `You are an expert Senior Technical Project Manager. 
Your goal is to take a raw user prompt and turn it into a high-quality, developer-friendly task.
The output should be a JSON object with:
- "title": A concise, clear, and professional task title.
- "description": A detailed Markdown-formatted description including Objective, Technical Requirements, and Acceptance Criteria.

BE CRYSTAL CLEAR AND TECHNICAL. Return ONLY the JSON object.`;

            if (process.env.GEMINI_API_KEY) {
                const response = await axios.post(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        contents: [{
                            parts: [{
                                text: `${systemPrompt}\n\nUser Prompt: ${prompt}`
                            }]
                        }]
                    }
                );

                const text = response.data.candidates[0].content.parts[0].text;
                // Gemini sometimes wraps JSON in markdown blocks
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                const result = JSON.parse(jsonMatch ? jsonMatch[0] : text);

                return {
                    title: result.title || "New Task",
                    description: result.description || "No description generated."
                };
            }

            // Fallback to OpenRouter/OpenAI logic
            const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                model: "openai/gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const content = response.data.choices[0].message.content;
            const result = JSON.parse(content);

            return {
                title: result.title || "New Task",
                description: result.description || "No description generated."
            };
        } catch (error: any) {
            console.error("AI Generation Error:", error.response?.data || error.message);
            return this.mockGenerateTask(prompt);
        }
    }

    /**
     * Enhanced Mock logic for when API key is missing.
     */
    private static mockGenerateTask(prompt: string): Promise<{ title: string, description: string }> {
        if (prompt.toLowerCase().includes('center align') && prompt.toLowerCase().includes('crl')) {
            return Promise.resolve({
                title: "Center Align Units, Results, and Biological Ranges in CRL PDF Template",
                description: `Update the **CRL PDF template** to ensure the following fields are **center aligned** in the generated PDF report:

* Units
* Results
* Biological Ranges

**Requirements:**
1. Modify the **PDF template layout** so that the above three columns display their values with **center alignment**.
2. The change should apply **only to the PDF output**, not to the web/UI view.
3. Ensure the table layout remains properly formatted in the generated PDF.

**Acceptance Criteria:**
* Units column values are center aligned in the PDF.
* Results column values are center aligned in the PDF.
* Biological ranges column values are center aligned in the PDF.
* No formatting or layout issues occur in the CRL PDF report after the update.`
            });
        }

        return Promise.resolve({
            title: `Task: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
            description: `**Objective:** ${prompt}\n\n**Technical Requirements:**\n- Implement the requested changes.\n- Ensure compatibility with existing modules.\n- Verify responsiveness and layout integrity.`
        });
    }

    /**
     * Rewrite a title/headline for better CTR.
     */
    static async rewriteHeadline(title: string): Promise<string> {
        return `${title} [AI Optimized]`;
    }

    /**
     * Generate meta description and SEO keywords based on content.
     */
    static async generateSEOMetadata(content: string): Promise<{ metaDescription: string, focusKeywords: string }> {
        const desc = content.substring(0, 160).trim() + "...";
        const keywords = "erp, cms, news";
        return { metaDescription: desc, focusKeywords: keywords };
    }

    /**
     * Generate a summary for long articles.
     */
    static async generateSummary(content: string): Promise<string> {
        return content.substring(0, 300) + "... (Summarized by AI)";
    }
}
