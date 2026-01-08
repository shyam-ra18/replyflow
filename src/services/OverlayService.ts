import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { OverlayModule } = NativeModules;

interface OverlayModuleInterface {
    checkOverlayPermission(): Promise<boolean>;
    requestOverlayPermission(): void;
    startFloatingService(): Promise<boolean>;
    stopFloatingService(): Promise<boolean>;
    isServiceRunning(): Promise<boolean>;
    checkAccessibilityPermission(): Promise<boolean>;
    requestAccessibilityPermission(): void;
    checkNotificationPermission(): Promise<boolean>;
    requestNotificationPermission(): void;
}

const overlayModule = OverlayModule as OverlayModuleInterface;

class OverlayService {
    private eventEmitter: NativeEventEmitter;
    private listeners: Map<string, any> = new Map();

    constructor() {
        this.eventEmitter = new NativeEventEmitter(OverlayModule);
    }

    async checkOverlayPermission(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        try {
            return await overlayModule.checkOverlayPermission();
        } catch (error) {
            console.error('Error checking overlay permission:', error);
            return false;
        }
    }

    requestOverlayPermission(): void {
        if (Platform.OS !== 'android') return;
        try {
            overlayModule.requestOverlayPermission();
        } catch (error) {
            console.error('Error requesting overlay permission:', error);
        }
    }

    async checkAccessibilityPermission(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        try {
            return await overlayModule.checkAccessibilityPermission();
        } catch (error) {
            console.error('Error checking accessibility permission:', error);
            return false;
        }
    }

    requestAccessibilityPermission(): void {
        if (Platform.OS !== 'android') return;
        try {
            overlayModule.requestAccessibilityPermission();
        } catch (error) {
            console.error('Error requesting accessibility permission:', error);
        }
    }

    async checkNotificationPermission(): Promise<boolean> {
        if (Platform.OS !== 'android') return true;
        try {
            return await overlayModule.checkNotificationPermission();
        } catch (error) {
            console.error('Error checking notification permission:', error);
            return true;
        }
    }

    requestNotificationPermission(): void {
        if (Platform.OS !== 'android') return;
        try {
            overlayModule.requestNotificationPermission();
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    async startService(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        try {
            return await overlayModule.startFloatingService();
        } catch (error) {
            console.error('Error starting service:', error);
            return false;
        }
    }

    async stopService(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        try {
            return await overlayModule.stopFloatingService();
        } catch (error) {
            console.error('Error stopping service:', error);
            return false;
        }
    }

    async isServiceRunning(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;
        try {
            return await overlayModule.isServiceRunning();
        } catch (error) {
            console.error('Error checking service status:', error);
            return false;
        }
    }

    onFloatingButtonClicked(callback: () => void): () => void {
        const subscription = this.eventEmitter.addListener(
            'onFloatingButtonClicked',
            callback
        );
        this.listeners.set('onFloatingButtonClicked', subscription);
        return () => subscription.remove();
    }

    onTextChanged(callback: (data: { text: string; timestamp: number }) => void): () => void {
        const subscription = this.eventEmitter.addListener(
            'onTextChanged',
            callback
        );
        this.listeners.set('onTextChanged', subscription);
        return () => subscription.remove();
    }

    onTextFieldFocused(callback: (data: { text: string; timestamp: number }) => void): () => void {
        const subscription = this.eventEmitter.addListener(
            'onTextFieldFocused',
            callback
        );
        this.listeners.set('onTextFieldFocused', subscription);
        return () => subscription.remove();
    }

    removeAllListeners(): void {
        this.listeners.forEach(subscription => subscription.remove());
        this.listeners.clear();
    }
}

export default new OverlayService();
