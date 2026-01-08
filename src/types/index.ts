// Type definitions for the app

export interface ServiceStatus {
    isRunning: boolean;
    hasOverlayPermission: boolean;
    hasAccessibilityPermission: boolean;
    hasNotificationPermission: boolean;
}

export interface UserPreferences {
    apiKey: string;
    defaultTone: ToneType;
    enabledFeatures: {
        grammar: boolean;
        spelling: boolean;
        rephrase: boolean;
        tone: boolean;
        length: boolean;
    };
    floatingButtonSize: number;
    floatingButtonOpacity: number;
}

export type ToneType =
    | 'professional'
    | 'casual'
    | 'friendly'
    | 'formal'
    | 'confident'
    | 'polite'
    | 'direct';

export type FeatureType =
    | 'rephrase'
    | 'grammar'
    | 'spelling'
    | 'tone'
    | 'length';

export interface Suggestion {
    id: string;
    type: FeatureType;
    originalText: string;
    suggestedText: string;
    tone?: ToneType;
    timestamp: number;
}

export interface TabItem {
    id: FeatureType;
    label: string;
    icon: string;
}

export interface FloatingButtonPosition {
    x: number;
    y: number;
}
