import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSuggestionStore } from '../store/useSuggestionStore';

interface SuggestionBarProps {
    onSuggestionPress: (suggestion: string) => void;
}

const SuggestionBar: React.FC<SuggestionBarProps> = ({ onSuggestionPress }) => {
    const { suggestions, isLoading } = useSuggestionStore();

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading suggestions...</Text>
            </View>
        );
    }

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <ScrollView
            horizontal
            style={styles.container}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {suggestions.map((item, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => onSuggestionPress(item.text)}
                    activeOpacity={0.7}>
                    <Text style={styles.suggestionText}>{item.text}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    scrollContent: {
        paddingHorizontal: 8,
    },
    suggestionChip: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginHorizontal: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    suggestionText: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    loadingText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        paddingVertical: 4,
    },
});

export default SuggestionBar;
