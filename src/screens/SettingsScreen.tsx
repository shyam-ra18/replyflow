import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
} from 'react-native';
import StorageService from '../services/StorageService';
import GeminiService from '../services/GeminiService';
import { UserPreferences, ToneType } from '../types';

const SettingsScreen: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [testingApi, setTestingApi] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const [savedApiKey, savedPreferences] = await Promise.all([
            StorageService.getApiKey(),
            StorageService.getPreferences(),
        ]);

        if (savedApiKey) setApiKey(savedApiKey);
        setPreferences(savedPreferences);
    };

    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            Alert.alert('Error', 'Please enter a valid API key');
            return;
        }

        try {
            await StorageService.saveApiKey(apiKey);
            await GeminiService.setApiKey(apiKey);
            Alert.alert('Success', 'API key saved successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to save API key');
        }
    };

    const handleTestApi = async () => {
        if (!apiKey.trim()) {
            Alert.alert('Error', 'Please enter an API key first');
            return;
        }

        setTestingApi(true);
        try {
            await GeminiService.setApiKey(apiKey);
            const result = await GeminiService.checkGrammar('This are a test');
            Alert.alert('Success', `API is working!\n\nTest result: ${result}`);
        } catch (error: any) {
            console.log("error ==> ", error);
            Alert.alert('Error', error.message || 'Failed to test API');
        } finally {
            setTestingApi(false);
        }
    };

    const handleToggleFeature = async (feature: keyof UserPreferences['enabledFeatures']) => {
        if (!preferences) return;

        const updated = {
            ...preferences,
            enabledFeatures: {
                ...preferences.enabledFeatures,
                [feature]: !preferences.enabledFeatures[feature],
            },
        };

        setPreferences(updated);
        await StorageService.savePreferences(updated);
    };

    const handleClearCache = async () => {
        Alert.alert(
            'Clear Cache',
            'Are you sure you want to clear the suggestion cache?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                        GeminiService.clearCache();
                        Alert.alert('Success', 'Cache cleared');
                    },
                },
            ]
        );
    };

    if (!preferences) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* API Configuration */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>API Configuration</Text>
                <Text style={styles.label}>Google Gemini API Key</Text>
                <TextInput
                    style={styles.input}
                    value={apiKey}
                    onChangeText={setApiKey}
                    placeholder="Enter your API key"
                    secureTextEntry
                    autoCapitalize="none"
                />
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonSecondary]}
                        onPress={handleSaveApiKey}
                    >
                        <Text style={styles.buttonSecondaryText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary]}
                        onPress={handleTestApi}
                        disabled={testingApi}
                    >
                        <Text style={styles.buttonPrimaryText}>
                            {testingApi ? 'Testing...' : 'Test API'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.hint}>
                    Get your API key from Google AI Studio: https://makersuite.google.com/app/apikey
                </Text>
            </View>

            {/* Features */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Enabled Features</Text>

                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Grammar Check</Text>
                    <Switch
                        value={preferences.enabledFeatures.grammar}
                        onValueChange={() => handleToggleFeature('grammar')}
                        trackColor={{ false: '#ccc', true: '#4285F4' }}
                    />
                </View>

                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Spelling Check</Text>
                    <Switch
                        value={preferences.enabledFeatures.spelling}
                        onValueChange={() => handleToggleFeature('spelling')}
                        trackColor={{ false: '#ccc', true: '#4285F4' }}
                    />
                </View>

                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Rephrase</Text>
                    <Switch
                        value={preferences.enabledFeatures.rephrase}
                        onValueChange={() => handleToggleFeature('rephrase')}
                        trackColor={{ false: '#ccc', true: '#4285F4' }}
                    />
                </View>

                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Tone Adjustment</Text>
                    <Switch
                        value={preferences.enabledFeatures.tone}
                        onValueChange={() => handleToggleFeature('tone')}
                        trackColor={{ false: '#ccc', true: '#4285F4' }}
                    />
                </View>

                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Length Adjustment</Text>
                    <Switch
                        value={preferences.enabledFeatures.length}
                        onValueChange={() => handleToggleFeature('length')}
                        trackColor={{ false: '#ccc', true: '#4285F4' }}
                    />
                </View>
            </View>

            {/* Privacy */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Privacy</Text>
                <TouchableOpacity style={styles.settingButton} onPress={handleClearCache}>
                    <Text style={styles.settingButtonText}>Clear Suggestion Cache</Text>
                </TouchableOpacity>
                <Text style={styles.hint}>
                    ReplyFlow respects your privacy. Passwords and sensitive information are never captured.
                </Text>
            </View>

            {/* About */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.aboutText}>ReplyFlow v1.0.0</Text>
                <Text style={styles.aboutText}>AI-powered writing assistant</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    section: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        color: '#333',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: '#4285F4',
    },
    buttonSecondary: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#4285F4',
    },
    buttonPrimaryText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    buttonSecondaryText: {
        color: '#4285F4',
        fontWeight: '600',
        fontSize: 14,
    },
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 8,
        lineHeight: 18,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingLabel: {
        fontSize: 16,
        color: '#333',
    },
    settingButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    settingButtonText: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
    },
    aboutText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
});

export default SettingsScreen;
