import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Clipboard,
    Alert,
    Modal,
} from 'react-native';
import { FeatureType, ToneType } from '../types';
import GeminiService from '../services/GeminiService';

interface SuggestionBottomSheetProps {
    isVisible: boolean;
    capturedText: string;
    onClose: () => void;
    onApply: (text: string) => void;
}

const TABS: Array<{ id: FeatureType; label: string; icon: string }> = [
    { id: 'rephrase', label: 'Rephrase', icon: '✨' },
    { id: 'grammar', label: 'Grammar', icon: '✓' },
    { id: 'spelling', label: 'Spelling', icon: 'Aa' },
    { id: 'tone', label: 'Tone', icon: '🎭' },
    { id: 'length', label: 'Length', icon: '↔️' },
];

const TONES: ToneType[] = ['professional', 'casual', 'friendly', 'formal', 'confident', 'polite'];

const SuggestionBottomSheet: React.FC<SuggestionBottomSheetProps> = ({
    isVisible,
    capturedText,
    onClose,
    onApply,
}) => {
    const [activeTab, setActiveTab] = useState<FeatureType>('grammar');
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState<string>('');
    const [selectedTone, setSelectedTone] = useState<ToneType>('professional');

    useEffect(() => {
        if (isVisible && capturedText) {
            generateSuggestion();
        }
    }, [isVisible, activeTab, selectedTone]);

    const generateSuggestion = async () => {
        if (!capturedText || capturedText.length < 3) {
            setSuggestion('Text too short for suggestions');
            return;
        }

        setLoading(true);
        setSuggestion('');

        try {
            // Using the new unified processText method
            // 'length' tab maps to 'shorten' feature
            const feature = activeTab === 'length' ? 'shorten' : activeTab;
            const result = await GeminiService.processText(capturedText, feature, selectedTone);
            setSuggestion(result);
        } catch (error: any) {
            setSuggestion(`Error: ${error.message || 'Failed to generate suggestion'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (suggestion && !loading) {
            Clipboard.setString(suggestion);
            onApply(suggestion);
            onClose();
        }
    };

    const handleCopy = () => {
        if (suggestion) {
            Clipboard.setString(suggestion);
            Alert.alert('Copied', 'Suggestion copied to clipboard');
        }
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Writing Assistant</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Original Text */}
                    <View style={styles.originalTextContainer}>
                        <Text style={styles.originalTextLabel}>Original:</Text>
                        <Text style={styles.originalText} numberOfLines={2}>
                            {capturedText}
                        </Text>
                    </View>

                    {/* Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.tabsContainer}
                    >
                        {TABS.map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                <Text style={styles.tabIcon}>{tab.icon}</Text>
                                <Text
                                    style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Tone Selector (for rephrase and tone tabs) */}
                    {(activeTab === 'rephrase' || activeTab === 'tone') && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.toneContainer}
                        >
                            {TONES.map((tone) => (
                                <TouchableOpacity
                                    key={tone}
                                    style={[
                                        styles.toneChip,
                                        selectedTone === tone && styles.toneChipActive,
                                    ]}
                                    onPress={() => setSelectedTone(tone)}
                                >
                                    <Text
                                        style={[
                                            styles.toneChipText,
                                            selectedTone === tone && styles.toneChipTextActive,
                                        ]}
                                    >
                                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    {/* Suggestion */}
                    <View style={styles.suggestionContainer}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4285F4" />
                                <Text style={styles.loadingText}>Generating suggestion...</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.suggestionLabel}>Suggestion:</Text>
                                <ScrollView style={styles.suggestionScroll}>
                                    <Text style={styles.suggestionText}>{suggestion || 'No suggestion yet'}</Text>
                                </ScrollView>
                            </>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.copyButton]}
                            onPress={handleCopy}
                            disabled={loading || !suggestion}
                        >
                            <Text style={styles.copyButtonText}>Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.applyButton]}
                            onPress={handleApply}
                            disabled={loading || !suggestion}
                        >
                            <Text style={styles.applyButtonText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        fontSize: 24,
        color: '#666',
    },
    originalTextContainer: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    originalTextLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    originalText: {
        fontSize: 14,
        color: '#333',
    },
    tabsContainer: {
        marginBottom: 12,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    tabActive: {
        backgroundColor: '#4285F4',
    },
    tabIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    tabLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    tabLabelActive: {
        color: '#fff',
    },
    toneContainer: {
        marginBottom: 12,
    },
    toneChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    toneChipActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#4285F4',
    },
    toneChipText: {
        fontSize: 12,
        color: '#666',
    },
    toneChipTextActive: {
        color: '#4285F4',
        fontWeight: '600',
    },
    suggestionContainer: {
        flex: 1,
        marginBottom: 16,
        minHeight: 150,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    suggestionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    suggestionScroll: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 12,
    },
    suggestionText: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    copyButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#4285F4',
    },
    copyButtonText: {
        color: '#4285F4',
        fontWeight: '600',
        fontSize: 16,
    },
    applyButton: {
        backgroundColor: '#4285F4',
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});

export default SuggestionBottomSheet;
