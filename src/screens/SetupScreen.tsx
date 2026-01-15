import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    NativeModules,
} from 'react-native';

const { KeyboardModule } = NativeModules;

const SetupScreen = ({ navigation }: any) => {
    const openKeyboardSettings = async () => {
        try {
            await KeyboardModule.openKeyboardSettings();
        } catch (error) {
            console.error('Failed to open settings:', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Setup Your Keyboard</Text>
                <Text style={styles.headerSubtitle}>Follow these simple steps</Text>
            </View>

            <View style={styles.stepCard}>
                <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Enable SmartType Keyboard</Text>
                    <Text style={styles.stepDescription}>
                        Tap the button below to open keyboard settings, then enable "SmartType AI Keyboard"
                    </Text>
                    <TouchableOpacity
                        style={styles.stepButton}
                        onPress={openKeyboardSettings}>
                        <Text style={styles.stepButtonText}>Open Keyboard Settings</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.stepCard}>
                <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Set as Default Keyboard</Text>
                    <Text style={styles.stepDescription}>
                        In the keyboard settings, select "SmartType AI Keyboard" as your default input method
                    </Text>
                </View>
            </View>

            <View style={styles.stepCard}>
                <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Start Typing!</Text>
                    <Text style={styles.stepDescription}>
                        Open any app (WhatsApp, Gmail, etc.) and start typing. You'll see AI suggestions appear automatically.
                    </Text>
                </View>
            </View>

            <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>💡 Tips</Text>
                <Text style={styles.tipText}>• AI suggestions appear as you type</Text>
                <Text style={styles.tipText}>• Tap suggestions to insert them quickly</Text>
                <Text style={styles.tipText}>• Use tone adjustment for different contexts</Text>
                <Text style={styles.tipText}>• Long-press for text expansion options</Text>
            </View>

            <TouchableOpacity
                style={styles.doneButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#4A90E2',
        padding: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#E3F2FD',
    },
    stepCard: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        flexDirection: 'row',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    stepNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    stepNumberText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    stepDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12,
    },
    stepButton: {
        backgroundColor: '#4A90E2',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    stepButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    tipsCard: {
        backgroundColor: '#FFF9C4',
        margin: 16,
        padding: 20,
        borderRadius: 12,
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#F57F17',
        marginBottom: 12,
    },
    tipText: {
        fontSize: 14,
        color: '#F57F17',
        marginBottom: 8,
        lineHeight: 20,
    },
    doneButton: {
        backgroundColor: '#4CAF50',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 32,
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SetupScreen;
