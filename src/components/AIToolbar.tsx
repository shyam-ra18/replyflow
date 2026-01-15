import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import type { ToneType } from '../types';

interface AIToolbarProps {
    onToneSelect: (tone: ToneType) => void;
    onExpand: () => void;
    onSummarize: () => void;
    onSmartReply: () => void;
}

const AIToolbar: React.FC<AIToolbarProps> = ({
    onToneSelect,
    onExpand,
    onSummarize,
    onSmartReply,
}) => {
    const [showToneMenu, setShowToneMenu] = useState(false);

    const tones: { label: string; value: ToneType }[] = [
        { label: '💼 Professional', value: 'professional' },
        { label: '😊 Casual', value: 'casual' },
        { label: '💪 Confident', value: 'confident' },
        { label: '❤️ Empathetic', value: 'empathetic' },
        { label: '⚡ Concise', value: 'concise' },
    ];

    const handleToneSelect = (tone: ToneType) => {
        onToneSelect(tone);
        setShowToneMenu(false);
    };

    return (
        <>
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.toolButton}
                    onPress={() => setShowToneMenu(true)}>
                    <Text style={styles.toolIcon}>🎭</Text>
                    <Text style={styles.toolLabel}>Tone</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.toolButton} onPress={onExpand}>
                    <Text style={styles.toolIcon}>📝</Text>
                    <Text style={styles.toolLabel}>Expand</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.toolButton} onPress={onSummarize}>
                    <Text style={styles.toolIcon}>📋</Text>
                    <Text style={styles.toolLabel}>Summarize</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.toolButton} onPress={onSmartReply}>
                    <Text style={styles.toolIcon}>💬</Text>
                    <Text style={styles.toolLabel}>Reply</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={showToneMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowToneMenu(false)}>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowToneMenu(false)}>
                    <View style={styles.toneMenu}>
                        <Text style={styles.menuTitle}>Select Tone</Text>
                        {tones.map((tone) => (
                            <TouchableOpacity
                                key={tone.value}
                                style={styles.toneOption}
                                onPress={() => handleToneSelect(tone.value)}>
                                <Text style={styles.toneText}>{tone.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#E5E7EB',
        paddingVertical: 6,
        paddingHorizontal: 4,
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#D1D5DB',
    },
    toolButton: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    toolIcon: {
        fontSize: 20,
        marginBottom: 2,
    },
    toolLabel: {
        fontSize: 10,
        color: '#374151',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    toneMenu: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        width: '80%',
        maxWidth: 300,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    toneOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        marginBottom: 8,
    },
    toneText: {
        fontSize: 16,
        color: '#374151',
    },
});

export default AIToolbar;
