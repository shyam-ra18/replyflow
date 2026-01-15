import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import type { ToneType } from '../types';

const SettingsScreen = () => {
    const {
        aiEnabled,
        hapticFeedback,
        soundEnabled,
        theme,
        selectedTone,
        setAIEnabled,
        setHapticFeedback,
        setSoundEnabled,
        setTheme,
        setSelectedTone,
    } = useSettingsStore();

    const tones: ToneType[] = ['professional', 'casual', 'confident', 'empathetic', 'concise'];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI Features</Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Enable AI Suggestions</Text>
                        <Text style={styles.settingDescription}>
                            Get smart word and phrase suggestions
                        </Text>
                    </View>
                    <Switch
                        value={aiEnabled}
                        onValueChange={setAIEnabled}
                        trackColor={{ false: '#D0D0D0', true: '#4A90E2' }}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Default Tone</Text>
                        <Text style={styles.settingDescription}>
                            {selectedTone ? `Current: ${selectedTone}` : 'No default tone'}
                        </Text>
                    </View>
                </View>

                <View style={styles.toneGrid}>
                    {tones.map((tone) => (
                        <TouchableOpacity
                            key={tone}
                            style={[
                                styles.toneButton,
                                selectedTone === tone && styles.toneButtonActive,
                            ]}
                            onPress={() => setSelectedTone(selectedTone === tone ? null : tone)}>
                            <Text
                                style={[
                                    styles.toneButtonText,
                                    selectedTone === tone && styles.toneButtonTextActive,
                                ]}>
                                {tone.charAt(0).toUpperCase() + tone.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Feedback</Text>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Haptic Feedback</Text>
                        <Text style={styles.settingDescription}>
                            Vibrate on key press
                        </Text>
                    </View>
                    <Switch
                        value={hapticFeedback}
                        onValueChange={setHapticFeedback}
                        trackColor={{ false: '#D0D0D0', true: '#4A90E2' }}
                    />
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={styles.settingLabel}>Sound Effects</Text>
                        <Text style={styles.settingDescription}>
                            Play sound on key press
                        </Text>
                    </View>
                    <Switch
                        value={soundEnabled}
                        onValueChange={setSoundEnabled}
                        trackColor={{ false: '#D0D0D0', true: '#4A90E2' }}
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Appearance</Text>

                <View style={styles.themeButtons}>
                    <TouchableOpacity
                        style={[
                            styles.themeButton,
                            theme === 'light' && styles.themeButtonActive,
                        ]}
                        onPress={() => setTheme('light')}>
                        <Text
                            style={[
                                styles.themeButtonText,
                                theme === 'light' && styles.themeButtonTextActive,
                            ]}>
                            Light
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.themeButton,
                            theme === 'dark' && styles.themeButtonActive,
                        ]}
                        onPress={() => setTheme('dark')}>
                        <Text
                            style={[
                                styles.themeButtonText,
                                theme === 'dark' && styles.themeButtonTextActive,
                            ]}>
                            Dark
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.themeButton,
                            theme === 'auto' && styles.themeButtonActive,
                        ]}
                        onPress={() => setTheme('auto')}>
                        <Text
                            style={[
                                styles.themeButtonText,
                                theme === 'auto' && styles.themeButtonTextActive,
                            ]}>
                            Auto
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>About</Text>
                <Text style={styles.infoText}>SmartType AI Keyboard v1.0.0</Text>
                <Text style={styles.infoText}>Powered by Google Gemini AI</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    section: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: '#666',
    },
    toneGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 8,
    },
    toneButton: {
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    toneButtonActive: {
        backgroundColor: '#4A90E2',
    },
    toneButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    toneButtonTextActive: {
        color: '#FFFFFF',
    },
    themeButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    themeButton: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    themeButtonActive: {
        backgroundColor: '#4A90E2',
    },
    themeButtonText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    themeButtonTextActive: {
        color: '#FFFFFF',
    },
    infoSection: {
        backgroundColor: '#E3F2FD',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        marginBottom: 32,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#1976D2',
        marginBottom: 4,
    },
});

export default SettingsScreen;
