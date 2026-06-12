import fs from 'fs';
import path from 'path';
import axios from 'axios';

export class GeminiService {
    private static keys: string[] = [];
    private static currentKeyIndex = 0;
    private static keysFilePath = 'f:\\applizor-ai-company-os\\config\\keys.json';

    private static models: string[] = [];
    private static currentModelIndex = 0;
    private static modelsFilePath = 'f:\\applizor-ai-company-os\\config\\models.json';

    /**
     * Load keys dynamically from the configuration folder
     */
    private static loadKeys() {
        try {
            if (fs.existsSync(this.keysFilePath)) {
                const content = fs.readFileSync(this.keysFilePath, 'utf8');
                this.keys = JSON.parse(content);
            }
        } catch (error) {
            console.error('Error loading Gemini API keys:', error);
        }

        // Fallback to process.env if file is empty
        if (!this.keys || this.keys.length === 0) {
            if (process.env.GEMINI_API_KEY) {
                this.keys = [process.env.GEMINI_API_KEY];
            } else {
                this.keys = [];
            }
        }
    }

    /**
     * Load models dynamically from the configuration folder
     */
    private static loadModels() {
        try {
            if (fs.existsSync(this.modelsFilePath)) {
                const content = fs.readFileSync(this.modelsFilePath, 'utf8');
                this.models = JSON.parse(content);
            }
        } catch (error) {
            console.error('Error loading Gemini models list:', error);
        }

        // Fallback if file is empty
        if (!this.models || this.models.length === 0) {
            this.models = ['gemini-2.5-flash'];
        }
    }

    /**
     * Get the next API key in a round-robin rotation
     */
    private static getNextKey(): string {
        this.loadKeys();
        if (this.keys.length === 0) {
            throw new Error('No Gemini API keys configured. Please verify config/keys.json');
        }
        const key = this.keys[this.currentKeyIndex];
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
        return key;
    }

    /**
     * Get the current model, and rotate if requested
     */
    private static getModel(rotate = false): string {
        this.loadModels();
        if (rotate) {
            this.currentModelIndex = (this.currentModelIndex + 1) % this.models.length;
        }
        return this.models[this.currentModelIndex] || 'gemini-2.5-flash';
    }

    /**
     * Sends a generation request to the Gemini API, with automatic key rotation and model fallback
     */
    static async generateText(prompt: string, systemInstruction?: string): Promise<string> {
        this.loadKeys();
        this.loadModels();

        const maxModelAttempts = this.models.length > 0 ? this.models.length : 1;
        const maxKeyAttempts = this.keys.length > 0 ? this.keys.length : 3;

        let modelAttempt = 0;

        while (modelAttempt < maxModelAttempts) {
            const modelName = this.getModel(modelAttempt > 0);
            let keyAttempt = 0;

            while (keyAttempt < maxKeyAttempts) {
                const key = this.getNextKey();
                try {
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
                    
                    const response = await axios.post(url, {
                        contents: [
                            {
                                parts: [
                                    { text: prompt }
                                ]
                            }
                        ],
                        systemInstruction: systemInstruction ? {
                            parts: [
                                { text: systemInstruction }
                            ]
                        } : undefined,
                        generationConfig: {
                            temperature: 0.2,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 8192,
                        }
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 20000 // 20s timeout
                    });

                    const candidate = response.data?.candidates?.[0];
                    const text = candidate?.content?.parts?.[0]?.text;
                    
                    if (text) {
                        return text;
                    }
                    
                    throw new Error('Invalid response structure from Gemini API');
                } catch (error: any) {
                    keyAttempt++;
                    const statusCode = error.response?.status;
                    console.warn(`Gemini key rotation attempt ${keyAttempt} failed for model ${modelName}. Status: ${statusCode || 'Timeout/Network Error'}.`);
                }
            }

            modelAttempt++;
            console.warn(`All API keys exhausted for model ${modelName}. Rotating to the next fallback model.`);
        }

        throw new Error('Gemini service failed. All configured models and keys were exhausted.');
    }
}
