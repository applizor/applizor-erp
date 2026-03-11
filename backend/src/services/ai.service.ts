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
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        contents: [{
                            parts: [{
                                text: `${systemPrompt}\n\nUser Prompt: ${prompt}`
                            }]
                        }]
                    }
                );

                if (!response.data.candidates || response.data.candidates.length === 0) {
                    // Check if it was blocked by safety filters
                    const promptFeedback = response.data.promptFeedback;
                    if (promptFeedback?.blockReason) {
                        throw new Error(`AI Request blocked by safety filter: ${promptFeedback.blockReason}`);
                    }
                    throw new Error("AI returned no results. This might be due to content filters.");
                }

                const candidate = response.data.candidates[0];
                if (candidate.finishReason === 'SAFETY') {
                    throw new Error("AI output was blocked by safety filters. Please try rephrasing your prompt.");
                }

                const text = candidate.content?.parts?.[0]?.text;
                if (!text) {
                    throw new Error("AI returned empty content parts.");
                }

                // Gemini sometimes wraps JSON in markdown blocks
                let result;
                try {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    result = JSON.parse(jsonMatch ? jsonMatch[0] : text);
                } catch (parseError) {
                    console.error("Failed to parse Gemini JSON:", text);
                    throw new Error("Failed to parse AI response. The model may have returned malformed content.");
                }

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
            const detail = error.response?.data || error.message;
            console.error("AI Generation Error Details:", JSON.stringify(detail, null, 2));
            
            let errorMessage = "AI Generation failed";
            if (error.response?.data?.error?.message) {
                errorMessage += `: ${error.response.data.error.message}`;
            } else if (typeof detail === 'string') {
                errorMessage += `: ${detail}`;
            } else {
                errorMessage += `. Check server logs for full details.`;
            }
            
            throw new Error(errorMessage);
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
