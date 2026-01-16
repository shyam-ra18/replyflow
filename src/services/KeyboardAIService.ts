import { NativeModules, NativeEventEmitter } from 'react-native';
import GeminiService from './GeminiService';
import type { ToneType } from '../types';

const { KeyboardModule } = NativeModules;

class KeyboardAIService {
    private eventEmitter: NativeEventEmitter | null = null;
    private aiActionSubscription: any = null;
    private isInitialized = false;

    initialize() {
        if (this.isInitialized) return;

        try {
            this.eventEmitter = new NativeEventEmitter(KeyboardModule);

            // Listen for AI action events from native keyboard
            this.aiActionSubscription = this.eventEmitter.addListener(
                'onAIAction',
                this.handleAIAction.bind(this)
            );

            this.isInitialized = true;
            console.log('KeyboardAIService initialized');
        } catch (error) {
            console.error('Failed to initialize KeyboardAIService:', error);
        }
    }

    private async handleAIAction(event: {
        action: string;
        text?: string;
        tone?: string;
    }) {
        console.log('AI Action received:', event);

        const { action, text = '', tone } = event;

        if (!text) {
            return;
        }

        // Handle cancel action
        if (action === 'cancel') {
            console.log('AI action cancelled by user');
            return;
        }

        try {
            switch (action) {
                case 'tone':
                    await this.handleToneAdjustment(text, tone as ToneType);
                    break;
                case 'expand':
                    await this.handleExpand(text);
                    break;
                case 'summarize':
                    await this.handleSummarize(text);
                    break;
                case 'replies':
                    await this.handleSmartReplies(text);
                    break;
                // REMOVED: No more real-time suggestions
                default:
                    console.warn('Unknown AI action:', action);
            }
        } catch (error) {
            console.error('AI action error:', error);
        }
    }

    private async handleToneAdjustment(text: string, tone: ToneType) {
        if (!text || !tone) return;

        try {
            console.log(`Adjusting tone to ${tone}:`, text);
            const adjusted = await GeminiService.adjustTone(text, tone);
            if (adjusted && adjusted !== text) {
                KeyboardModule.replaceWithAIResponse(adjusted);
            }
        } catch (error) {
            console.error('Tone adjustment error:', error);
        }
    }

    private async handleExpand(text: string) {
        if (!text) return;

        try {
            console.log('Expanding text:', text);
            const expanded = await GeminiService.expandText(text);
            if (expanded && expanded !== text) {
                KeyboardModule.replaceWithAIResponse(expanded);
            }
        } catch (error) {
            console.error('Expand error:', error);
        }
    }

    private async handleSummarize(text: string) {
        if (!text) return;

        try {
            console.log('Summarizing text:', text);
            const summary = await GeminiService.summarizeText(text);
            if (summary && summary !== text) {
                KeyboardModule.replaceWithAIResponse(summary);
            }
        } catch (error) {
            console.error('Summarize error:', error);
        }
    }

    private async handleSmartReplies(text: string) {
        try {
            console.log('Getting smart replies for:', text);
            const replies = await GeminiService.getSmartReplies(text);
            if (replies.length > 0) {
                // Insert the first reply directly
                // In a full implementation, we'd show a picker
                KeyboardModule.replaceWithAIResponse(replies[0]);
            }
        } catch (error) {
            console.error('Smart replies error:', error);
        }
    }

    destroy() {
        if (this.aiActionSubscription) {
            this.aiActionSubscription.remove();
            this.aiActionSubscription = null;
        }
        this.isInitialized = false;
    }
}

export default new KeyboardAIService();
