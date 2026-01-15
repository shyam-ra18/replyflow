export type ToneType = 'professional' | 'casual' | 'confident' | 'empathetic' | 'concise';

export interface KeyboardState {
    isEnabled: boolean;
    isDefault: boolean;
    currentText: string;
    inputType: number;
    isPassword: boolean;
}

export interface SuggestionItem {
    text: string;
    confidence: number;
}

export interface AIFeature {
    type: 'tone' | 'expand' | 'summarize' | 'reply';
    enabled: boolean;
}

export interface UserSettings {
    aiEnabled: boolean;
    hapticFeedback: boolean;
    soundEnabled: boolean;
    theme: 'light' | 'dark' | 'auto';
    selectedTone: ToneType | null;
}
