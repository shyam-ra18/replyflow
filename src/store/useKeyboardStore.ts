import { create } from 'zustand';
import type { KeyboardState } from '../types';

interface KeyboardStore extends KeyboardState {
    setEnabled: (enabled: boolean) => void;
    setDefault: (isDefault: boolean) => void;
    setCurrentText: (text: string) => void;
    setInputType: (type: number) => void;
    setIsPassword: (isPassword: boolean) => void;
    reset: () => void;
}

const initialState: KeyboardState = {
    isEnabled: false,
    isDefault: false,
    currentText: '',
    inputType: 0,
    isPassword: false,
};

export const useKeyboardStore = create<KeyboardStore>((set) => ({
    ...initialState,

    setEnabled: (enabled) => set({ isEnabled: enabled }),
    setDefault: (isDefault) => set({ isDefault }),
    setCurrentText: (text) => set({ currentText: text }),
    setInputType: (type) => set({ inputType: type }),
    setIsPassword: (isPassword) => set({ isPassword }),

    reset: () => set(initialState),
}));
