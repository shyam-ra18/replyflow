import { create } from 'zustand';
import type { SuggestionItem } from '../types';

interface SuggestionStore {
    suggestions: SuggestionItem[];
    isLoading: boolean;
    lastRequestTime: number;
    setSuggestions: (suggestions: string[]) => void;
    setLoading: (loading: boolean) => void;
    clearSuggestions: () => void;
    canRequest: () => boolean;
}

export const useSuggestionStore = create<SuggestionStore>((set, get) => ({
    suggestions: [],
    isLoading: false,
    lastRequestTime: 0,

    setSuggestions: (suggestions) => {
        const items: SuggestionItem[] = suggestions.map((text, index) => ({
            text,
            confidence: 1 - (index * 0.1), // Simple confidence scoring
        }));
        set({ suggestions: items, isLoading: false, lastRequestTime: Date.now() });
    },

    setLoading: (loading) => set({ isLoading: loading }),

    clearSuggestions: () => set({ suggestions: [], isLoading: false }),

    canRequest: () => {
        const { lastRequestTime } = get();
        // Throttle requests to max 1 per 300ms
        return Date.now() - lastRequestTime > 300;
    },
}));
