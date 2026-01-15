import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserSettings, ToneType } from '../types';

interface SettingsStore extends UserSettings {
    setAIEnabled: (enabled: boolean) => void;
    setHapticFeedback: (enabled: boolean) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setTheme: (theme: 'light' | 'dark' | 'auto') => void;
    setSelectedTone: (tone: ToneType | null) => void;
    loadSettings: () => Promise<void>;
    saveSettings: () => Promise<void>;
}

const STORAGE_KEY = '@smarttype_settings';

const defaultSettings: UserSettings = {
    aiEnabled: true,
    hapticFeedback: true,
    soundEnabled: false,
    theme: 'auto',
    selectedTone: null,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    ...defaultSettings,

    setAIEnabled: (enabled) => {
        set({ aiEnabled: enabled });
        get().saveSettings();
    },

    setHapticFeedback: (enabled) => {
        set({ hapticFeedback: enabled });
        get().saveSettings();
    },

    setSoundEnabled: (enabled) => {
        set({ soundEnabled: enabled });
        get().saveSettings();
    },

    setTheme: (theme) => {
        set({ theme });
        get().saveSettings();
    },

    setSelectedTone: (tone) => {
        set({ selectedTone: tone });
        get().saveSettings();
    },

    loadSettings: async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const settings = JSON.parse(stored);
                set(settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    },

    saveSettings: async () => {
        try {
            const { loadSettings, saveSettings, ...settings } = get();
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    },
}));
