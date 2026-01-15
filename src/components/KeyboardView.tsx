import React, { useState, useEffect } from 'react';
import { View, StyleSheet, NativeModules, Alert } from 'react-native';
import KeyboardKey from './KeyboardKey';
import SuggestionBar from './SuggestionBar';
import AIToolbar from './AIToolbar';
import GeminiService from '../services/GeminiService';
import { useSuggestionStore } from '../store/useSuggestionStore';
import { useSettingsStore } from '../store/useSettingsStore';
import type { ToneType } from '../types';

const { KeyboardModule } = NativeModules;

const KeyboardView: React.FC = () => {
    const [currentText, setCurrentText] = useState('');
    const [isShiftActive, setIsShiftActive] = useState(false);
    const { setSuggestions, setLoading, canRequest } = useSuggestionStore();
    const aiEnabled = useSettingsStore(state => state.aiEnabled);

    const qwertyRows = [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
    ];

    useEffect(() => {
        if (aiEnabled && currentText.length > 2 && canRequest()) {
            fetchSuggestions();
        }
    }, [currentText, aiEnabled]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const suggestions = await GeminiService.getSuggestions(currentText);
            setSuggestions(suggestions);
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        }
    };

    const insertText = (text: string) => {
        const textToInsert = isShiftActive ? text.toUpperCase() : text;
        KeyboardModule?.insertText(textToInsert);
        setCurrentText(prev => prev + textToInsert);
        if (isShiftActive) setIsShiftActive(false);
    };

    const handleBackspace = () => {
        KeyboardModule?.deleteText(1);
        setCurrentText(prev => prev.slice(0, -1));
    };

    const handleSpace = () => {
        insertText(' ');
    };

    const handleEnter = () => {
        insertText('\n');
    };

    const handleShift = () => {
        setIsShiftActive(!isShiftActive);
    };

    const handleSuggestionPress = (suggestion: string) => {
        KeyboardModule?.insertText(suggestion + ' ');
        setCurrentText(prev => prev + suggestion + ' ');
    };

    const handleToneAdjust = async (tone: ToneType) => {
        if (!currentText) {
            Alert.alert('No Text', 'Please type some text first');
            return;
        }

        try {
            const adjusted = await GeminiService.adjustTone(currentText, tone);
            // Replace current text with adjusted version
            KeyboardModule?.getCurrentText().then((text: string) => {
                if (text) {
                    KeyboardModule?.replaceText(0, text.length, adjusted);
                    setCurrentText(adjusted);
                }
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to adjust tone');
        }
    };

    const handleExpand = async () => {
        if (!currentText) {
            Alert.alert('No Text', 'Please type some text first');
            return;
        }

        try {
            const expanded = await GeminiService.expandText(currentText);
            KeyboardModule?.getCurrentText().then((text: string) => {
                if (text) {
                    KeyboardModule?.replaceText(0, text.length, expanded);
                    setCurrentText(expanded);
                }
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to expand text');
        }
    };

    const handleSummarize = async () => {
        if (!currentText) {
            Alert.alert('No Text', 'Please type some text first');
            return;
        }

        try {
            const summary = await GeminiService.summarizeText(currentText);
            KeyboardModule?.getCurrentText().then((text: string) => {
                if (text) {
                    KeyboardModule?.replaceText(0, text.length, summary);
                    setCurrentText(summary);
                }
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to summarize text');
        }
    };

    const handleSmartReply = async () => {
        try {
            const replies = await GeminiService.getSmartReplies(currentText);
            if (replies.length > 0) {
                setSuggestions(replies);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to generate smart replies');
        }
    };

    return (
        <View style={styles.container}>
            {aiEnabled && <SuggestionBar onSuggestionPress={handleSuggestionPress} />}

            {aiEnabled && (
                <AIToolbar
                    onToneSelect={handleToneAdjust}
                    onExpand={handleExpand}
                    onSummarize={handleSummarize}
                    onSmartReply={handleSmartReply}
                />
            )}

            <View style={styles.keyboard}>
                {/* Row 1 */}
                <View style={styles.row}>
                    {qwertyRows[0].map((key) => (
                        <KeyboardKey
                            key={key}
                            label={isShiftActive ? key.toUpperCase() : key}
                            onPress={() => insertText(key)}
                        />
                    ))}
                </View>

                {/* Row 2 */}
                <View style={styles.row}>
                    <View style={{ flex: 0.5 }} />
                    {qwertyRows[1].map((key) => (
                        <KeyboardKey
                            key={key}
                            label={isShiftActive ? key.toUpperCase() : key}
                            onPress={() => insertText(key)}
                        />
                    ))}
                    <View style={{ flex: 0.5 }} />
                </View>

                {/* Row 3 */}
                <View style={styles.row}>
                    <KeyboardKey
                        label="⇧"
                        onPress={handleShift}
                        flex={1.5}
                        isSpecial
                        style={isShiftActive ? styles.shiftActive : undefined}
                    />
                    {qwertyRows[2].map((key) => (
                        <KeyboardKey
                            key={key}
                            label={isShiftActive ? key.toUpperCase() : key}
                            onPress={() => insertText(key)}
                        />
                    ))}
                    <KeyboardKey
                        label="⌫"
                        onPress={handleBackspace}
                        flex={1.5}
                        isSpecial
                    />
                </View>

                {/* Row 4 - Bottom row */}
                <View style={styles.row}>
                    <KeyboardKey
                        label="123"
                        onPress={() => { }}
                        flex={1.5}
                        isSpecial
                    />
                    <KeyboardKey
                        label="Space"
                        onPress={handleSpace}
                        flex={5}
                    />
                    <KeyboardKey
                        label="↵"
                        onPress={handleEnter}
                        flex={1.5}
                        isSpecial
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#D1D5DB',
    },
    keyboard: {
        padding: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    shiftActive: {
        backgroundColor: '#4A90E2',
    },
});

export default KeyboardView;
