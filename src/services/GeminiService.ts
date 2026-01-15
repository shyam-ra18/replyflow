import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ToneType } from '../types';

// API key - you can set this directly or use environment config
const GEMINI_API_KEY = '';
const GEMINI_MODEL = 'gemini-3-flash-preview';

class GeminiService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private cache: Map<string, { result: string; timestamp: number }>;
    private requestQueue: Map<string, Promise<any>>;

    constructor() {
        this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL });
        this.cache = new Map();
        this.requestQueue = new Map();
    }

    // Get next word suggestions
    async getSuggestions(text: string, context?: string): Promise<string[]> {
        if (!text || text.trim().length === 0) return [];

        const cacheKey = `suggestions_${text}_${context}`;

        // Check cache first
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch {
                return [];
            }
        }

        const prompt = `Given the text: "${text}"${context ? ` and context: "${context}"` : ''}, provide 3 short next word or phrase suggestions that naturally continue the sentence. Return ONLY a JSON array of strings, no explanation. Example: ["suggestion1", "suggestion2", "suggestion3"]`;
        console.log(prompt);
        try {
            const result = await this.generateWithTimeout(prompt, 30000);
            const suggestions = this.parseJsonResponse(result);
            this.setCache(cacheKey, JSON.stringify(suggestions));
            return suggestions;
        } catch (error) {
            console.error('Suggestion error:', error);
            return [];
        }
    }

    // Adjust tone of text
    async adjustTone(text: string, tone: ToneType): Promise<string> {
        if (!text || text.trim().length === 0) return text;

        const cacheKey = `tone_${tone}_${text}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const prompts: Record<ToneType, string> = {
            professional: `Rewrite this text in a professional, formal tone suitable for business communication: "${text}". Return ONLY the rewritten text, no explanation.`,
            casual: `Rewrite this text in a casual, friendly, conversational tone: "${text}". Return ONLY the rewritten text, no explanation.`,
            confident: `Rewrite this text in a confident, assertive tone that shows authority: "${text}". Return ONLY the rewritten text, no explanation.`,
            empathetic: `Rewrite this text in an empathetic, supportive, understanding tone: "${text}". Return ONLY the rewritten text, no explanation.`,
            concise: `Make this text more concise and brief while keeping the core message: "${text}". Return ONLY the rewritten text, no explanation.`
        };

        try {
            const result = await this.generateWithTimeout(prompts[tone], 30000);
            const adjusted = result.trim().replace(/^["']|["']$/g, '');
            this.setCache(cacheKey, adjusted);
            return adjusted;
        } catch (error) {
            console.error('Tone adjustment error:', error);
            return text;
        }
    }

    // Smart reply suggestions
    async getSmartReplies(message: string, context?: string): Promise<string[]> {
        if (!message || message.trim().length === 0) return [];

        const cacheKey = `replies_${message}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch {
                return ['Thanks!', 'Sounds good', 'Got it'];
            }
        }

        const prompt = `Given this message: "${message}", provide 3 short, contextually appropriate reply options. Keep each reply under 10 words. Return ONLY a JSON array of strings. Example: ["reply1", "reply2", "reply3"]`;

        try {
            const result = await this.generateWithTimeout(prompt, 30000);
            const replies = this.parseJsonResponse(result);
            this.setCache(cacheKey, JSON.stringify(replies));
            return replies;
        } catch (error) {
            console.error('Smart reply error:', error);
            return ['Thanks!', 'Sounds good', 'Got it'];
        }
    }

    // Expand text
    async expandText(text: string): Promise<string> {
        if (!text || text.trim().length === 0) return text;

        const cacheKey = `expand_${text}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const prompt = `Expand this brief text into a complete, well-written sentence or paragraph: "${text}". Keep it natural and conversational. Return ONLY the expanded text.`;

        try {
            const result = await this.generateWithTimeout(prompt, 30000);
            const expanded = result.trim();
            this.setCache(cacheKey, expanded);
            return expanded;
        } catch (error) {
            console.error('Expansion error:', error);
            return text;
        }
    }

    // Summarize text
    async summarizeText(text: string): Promise<string> {
        if (!text || text.trim().length === 0) return text;

        const cacheKey = `summarize_${text}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        const prompt = `Summarize this text concisely in 1-2 sentences: "${text}". Return ONLY the summary.`;

        try {
            const result = await this.generateWithTimeout(prompt, 30000);
            const summary = result.trim();
            this.setCache(cacheKey, summary);
            return summary;
        } catch (error) {
            console.error('Summarization error:', error);
            return text;
        }
    }

    // Helper: Generate with timeout
    private async generateWithTimeout(prompt: string, timeout: number): Promise<string> {
        return Promise.race([
            this.generate(prompt),
            new Promise<string>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), timeout)
            )
        ]);
    }

    // Helper: Generate content
    private async generate(prompt: string): Promise<string> {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }

    // Helper: Parse JSON response
    private parseJsonResponse(response: string): string[] {
        try {
            // Remove markdown code blocks if present
            const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleaned);
        } catch {
            // Fallback: try to extract array from text
            const match = response.match(/\[.*\]/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch {
                    return [];
                }
            }
            return [];
        }
    }

    // Cache management
    private getFromCache(key: string): string | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        // Cache expires after 5 minutes
        if (Date.now() - cached.timestamp > 300000) {
            this.cache.delete(key);
            return null;
        }

        return cached.result;
    }

    private setCache(key: string, result: string): void {
        // Keep cache size under 100 items
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
            }
        }

        this.cache.set(key, { result, timestamp: Date.now() });
    }

    // Clear old cache entries
    clearOldCache(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        this.cache.forEach((value, key) => {
            if (now - value.timestamp > 300000) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.cache.delete(key));
    }
}

export default new GeminiService();
