import { GoogleGenerativeAI } from '@google/generative-ai';
import { ToneType } from '../types';
import StorageService from './StorageService';

interface CacheEntry {
    result: string;
    timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 10;

class GeminiService {
    private genAI: GoogleGenerativeAI | null = null;
    private cache: Map<string, CacheEntry> = new Map();

    async initialize(): Promise<boolean> {
        try {
            const apiKey = await StorageService.getApiKey();
            if (!apiKey) {
                console.warn('No API key found');
                return false;
            }
            if (apiKey.startsWith('sk-')) {
                throw new Error('This looks like an OpenAI key. Please use a Gemini API key starting with "AIza" from Google AI Studio.');
            }
            this.genAI = new GoogleGenerativeAI(apiKey);
            return true;
        } catch (error) {
            console.error('Error initializing Gemini:', error);
            return false;
        }
    }

    async setApiKey(apiKey: string): Promise<void> {
        await StorageService.saveApiKey(apiKey);
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    private getCacheKey(action: string, text: string): string {
        return `${action}_${text.substring(0, 50)}`;
    }

    private getFromCache(key: string): string | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > CACHE_TTL) {
            this.cache.delete(key);
            return null;
        }

        return entry.result;
    }

    private saveToCache(key: string, result: string): void {
        // Limit cache size
        if (this.cache.size >= MAX_CACHE_SIZE) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            result,
            timestamp: Date.now(),
        });
    }

    private async generateContent(prompt: string, cacheKey?: string): Promise<string> {
        if (!this.genAI) {
            const initialized = await this.initialize();
            if (!initialized || !this.genAI) {
                throw new Error('Gemini API not initialized. Please set your API key.');
            }
        }

        // Check cache
        if (cacheKey) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('Returning cached result');
                return cached;
            }
        }

        try {
            const model = this.genAI!.getGenerativeModel({ model: 'gemini-2.5-flash' });
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Save to cache
            if (cacheKey) {
                this.saveToCache(cacheKey, text);
            }

            return text;
        } catch (error: any) {
            console.error('Detailed Gemini Error:', error);
            if (error.message?.includes('API_KEY_INVALID')) {
                throw new Error('Invalid API Key. Please ensure you are using a key from Google AI Studio (starts with AIza).');
            }
            throw new Error(error.message || 'Failed to generate content. Please check your API key and try again.');
        }
    }

    async checkGrammar(text: string): Promise<string> {
        return this.processText(text, 'grammar');
    }

    async checkSpelling(text: string): Promise<string> {
        return this.processText(text, 'spelling');
    }

    async rephraseText(text: string, tone: ToneType): Promise<string> {
        return this.processText(text, 'rephrase', tone);
    }

    async adjustTone(text: string, tone: ToneType): Promise<string> {
        return this.processText(text, 'tone', tone);
    }

    async shortenText(text: string): Promise<string> {
        return this.processText(text, 'shorten');
    }

    async expandText(text: string): Promise<string> {
        return this.processText(text, 'expand');
    }

    /**
     * Centralized method to process text based on feature and tone
     */
    async processText(text: string, feature: string, tone: ToneType = 'professional'): Promise<string> {
        let prompt = '';

        switch (feature) {
            case 'grammar':
                prompt = `Correct the grammar and punctuation of the following text while keeping its original meaning. Return ONLY the corrected text: "${text}"`;
                break;
            case 'spelling':
                prompt = `Fix any spelling errors in the following text. Return ONLY the corrected text: "${text}"`;
                break;
            case 'rephrase':
                prompt = `Rewrite the following text to make it sound more ${tone}. Keep the core message same but improve the flow and vocabulary. Return ONLY the rewritten text: "${text}"`;
                break;
            case 'tone':
                prompt = `Change the tone of the following text to be strictly ${tone}. Return ONLY the adjusted text: "${text}"`;
                break;
            case 'shorten':
                prompt = `Shorten the following text to be as concise as possible while retaining all key information. Return ONLY the shortened text: "${text}"`;
                break;
            case 'expand':
                prompt = `Elaborate on the following text to provide more detail and context, keep it ${tone}. Return ONLY the expanded text: "${text}"`;
                break;
            default:
                prompt = `Refine the following text: "${text}"`;
        }

        const cacheKey = this.getCacheKey(`${feature}_${tone}`, text);
        return this.generateContent(prompt, cacheKey);
    }

    clearCache(): void {
        this.cache.clear();
    }
}

export default new GeminiService();
