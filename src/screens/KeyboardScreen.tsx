import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import KeyboardView from '../components/KeyboardView';
import { useSettingsStore } from '../store/useSettingsStore';

const KeyboardScreen: React.FC = () => {
    const loadSettings = useSettingsStore(state => state.loadSettings);

    useEffect(() => {
        loadSettings();
    }, []);

    return (
        <View style={styles.container}>
            <KeyboardView />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D1D5DB',
        justifyContent: 'flex-end',
    },
});

export default KeyboardScreen;
