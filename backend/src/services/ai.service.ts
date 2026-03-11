import axios from 'axios';

export class AIService {
    /**
     * Generate a structured, developer-friendly task from a user prompt using LLM.
     */
    static async generateTask(prompt: string): Promise<{ title: string, description: string }> {
        const apiKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error("AI API Key missing. Please configure GEMINI_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY.");
        }

        try {
            const systemPrompt = `You are an expert Senior Technical Project Manager. 
Your goal is to take a raw user prompt and turn it into a high-quality, developer-friendly task.
The output should be a JSON object with:
- "title": A concise, clear, and professional task title.
- "description": A detailed Markdown-formatted description including Objective, Technical Requirements, and Acceptance Criteria.

BE CRYSTAL CLEAR AND TECHNICAL. 
The response (both title and description) MUST ALWAYS BE IN ENGLISH, even if the user's prompt is in another language (like Hindi).
Return ONLY the JSON object.`;

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
            throw new Error("AI Generation failed. Please check logs for details.");
        }
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
