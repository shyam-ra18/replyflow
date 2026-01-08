import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, FloatingButtonPosition } from '../types';

const KEYS = {
    API_KEY: '@replyflow_api_key',
    PREFERENCES: '@replyflow_preferences',
    BUTTON_POSITION: '@replyflow_button_position',
    SERVICE_ENABLED: '@replyflow_service_enabled',
    ONBOARDING_COMPLETE: '@replyflow_onboarding_complete',
};

const DEFAULT_PREFERENCES: UserPreferences = {
    apiKey: '',
    defaultTone: 'professional',
    enabledFeatures: {
        grammar: true,
        spelling: true,
        rephrase: true,
        tone: true,
        length: true,
    },
    floatingButtonSize: 60,
    floatingButtonOpacity: 0.9,
};

class StorageService {
    // API Key
    async saveApiKey(apiKey: string): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.API_KEY, apiKey);
        } catch (error) {
            console.error('Error saving API key:', error);
            throw error;
        }
    }

    async getApiKey(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(KEYS.API_KEY);
        } catch (error) {
            console.error('Error getting API key:', error);
            return null;
        }
    }

    // User Preferences
    async savePreferences(preferences: UserPreferences): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
            throw error;
        }
    }

    async getPreferences(): Promise<UserPreferences> {
        try {
            const data = await AsyncStorage.getItem(KEYS.PREFERENCES);
            return data ? JSON.parse(data) : DEFAULT_PREFERENCES;
        } catch (error) {
            console.error('Error getting preferences:', error);
            return DEFAULT_PREFERENCES;
        }
    }

    // Floating Button Position
    async saveButtonPosition(position: FloatingButtonPosition): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.BUTTON_POSITION, JSON.stringify(position));
        } catch (error) {
            console.error('Error saving button position:', error);
            throw error;
        }
    }

    async getButtonPosition(): Promise<FloatingButtonPosition | null> {
        try {
            const data = await AsyncStorage.getItem(KEYS.BUTTON_POSITION);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting button position:', error);
            return null;
        }
    }

    // Service State
    async setServiceEnabled(enabled: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.SERVICE_ENABLED, JSON.stringify(enabled));
        } catch (error) {
            console.error('Error saving service state:', error);
            throw error;
        }
    }

    async isServiceEnabled(): Promise<boolean> {
        try {
            const data = await AsyncStorage.getItem(KEYS.SERVICE_ENABLED);
            return data ? JSON.parse(data) : false;
        } catch (error) {
            console.error('Error getting service state:', error);
            return false;
        }
    }

    // Onboarding
    async setOnboardingComplete(complete: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, JSON.stringify(complete));
        } catch (error) {
            console.error('Error saving onboarding state:', error);
            throw error;
        }
    }

    async isOnboardingComplete(): Promise<boolean> {
        try {
            const data = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
            return data ? JSON.parse(data) : false;
        } catch (error) {
            console.error('Error getting onboarding state:', error);
            return false;
        }
    }

    // Clear all data
    async clearAll(): Promise<void> {
        try {
            await AsyncStorage.multiRemove(Object.values(KEYS));
        } catch (error) {
            console.error('Error clearing storage:', error);
            throw error;
        }
    }
}

export default new StorageService();
