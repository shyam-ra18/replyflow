import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

interface KeyboardKeyProps {
    label: string;
    onPress: () => void;
    flex?: number;
    style?: ViewStyle;
    isSpecial?: boolean;
}

const KeyboardKey: React.FC<KeyboardKeyProps> = ({
    label,
    onPress,
    flex = 1,
    style,
    isSpecial = false
}) => {
    const handlePress = () => {
        ReactNativeHapticFeedback.trigger('impactLight');
        onPress();
    };

    return (
        <TouchableOpacity
            style={[
                styles.key,
                { flex },
                isSpecial && styles.specialKey,
                style,
            ]}
            onPress={handlePress}
            activeOpacity={0.7}>
            <Text style={[styles.keyText, isSpecial && styles.specialKeyText]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    key: {
        backgroundColor: '#FFFFFF',
        margin: 3,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 45,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    keyText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#000000',
    },
    specialKey: {
        backgroundColor: '#D1D5DB',
    },
    specialKeyText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default KeyboardKey;
