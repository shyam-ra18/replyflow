import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    NativeModules,
    TextInput,
} from 'react-native';
import { useKeyboardStore } from '../store/useKeyboardStore';
import { useSettingsStore } from '../store/useSettingsStore';

const { KeyboardModule } = NativeModules;

const HomeScreen = ({ navigation }: any) => {
    const { isEnabled, isDefault, setEnabled, setDefault } = useKeyboardStore();
    const aiEnabled = useSettingsStore(state => state.aiEnabled);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        checkKeyboardStatus();
    }, []);

    const checkKeyboardStatus = async () => {
        setIsChecking(true);
        try {
            const enabled = await KeyboardModule.isKeyboardEnabled();
            const defaultKb = await KeyboardModule.isDefaultKeyboard();
            setEnabled(enabled);
            setDefault(defaultKb);
        } catch (error) {
            console.error('Failed to check keyboard status:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const openKeyboardSettings = async () => {
        try {
            await KeyboardModule.openKeyboardSettings();
        } catch (error) {
            console.error('Failed to open settings:', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Test Input */}
            <View style={styles.testCard}>
                <Text style={styles.testTitle}>🎯 Test Your Keyboard</Text>
                <TextInput
                    style={styles.testInput}
                    placeholder="Tap here to test the keyboard..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                />
                <Text style={styles.testHint}>
                    💡 Tap the input above to open your keyboard
                </Text>
            </View>

            {/* Keyboard Status */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Keyboard Status</Text>
                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Status:</Text>
                    <Text style={[styles.statusValue, { color: isEnabled ? '#4CAF50' : '#F44336' }]}>
                        {isEnabled ? (isDefault ? 'Active & Default' : 'Enabled') : 'Not Enabled'}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.button}
                    onPress={checkKeyboardStatus}
                    disabled={isChecking}>
                    <Text style={styles.buttonText}>
                        {isChecking ? 'Checking...' : 'Refresh Status'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* AI Features */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>AI Features</Text>
                <View style={styles.featureRow}>
                    <Text style={styles.featureLabel}>AI Suggestions</Text>
                    <Text style={styles.featureValue}>{aiEnabled ? 'ON' : 'OFF'}</Text>
                </View>
                <View style={styles.featureRow}>
                    <Text style={styles.featureLabel}>Tone Adjustment</Text>
                    <Text style={styles.featureValue}>5 Tones</Text>
                </View>
                <View style={styles.featureRow}>
                    <Text style={styles.featureLabel}>Text Expansion</Text>
                    <Text style={styles.featureValue}>Active</Text>
                </View>
                <View style={styles.featureRow}>
                    <Text style={styles.featureLabel}>Smart Replies</Text>
                    <Text style={styles.featureValue}>Active</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Quick Actions</Text>

                {!isEnabled && (
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={() => navigation.navigate('Setup')}>
                        <Text style={[styles.buttonText, styles.primaryButtonText]}>
                            Setup Keyboard
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.button}
                    onPress={openKeyboardSettings}>
                    <Text style={styles.buttonText}>Keyboard Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Settings')}>
                    <Text style={styles.buttonText}>App Settings</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    testCard: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        marginTop: 16,
        padding: 20,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    testTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    testInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    testHint: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 8,
        fontStyle: 'italic',
    },
    card: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        marginTop: 0,
        padding: 20,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusLabel: {
        fontSize: 16,
        color: '#666',
    },
    statusValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    featureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    featureLabel: {
        fontSize: 16,
        color: '#666',
    },
    featureValue: {
        fontSize: 16,
        color: '#4A90E2',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#F0F0F0',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    primaryButton: {
        backgroundColor: '#4A90E2',
    },
    primaryButtonText: {
        color: '#FFFFFF',
    },
});

export default HomeScreen;
