import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    ScrollView,
    Alert,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import OverlayService from '../services/OverlayService';
import StorageService from '../services/StorageService';
import { ServiceStatus } from '../types';

const HomeScreen: React.FC = () => {
    const navigation = useNavigation();
    const [isServiceEnabled, setIsServiceEnabled] = useState(false);
    const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
        isRunning: false,
        hasOverlayPermission: false,
        hasAccessibilityPermission: false,
        hasNotificationPermission: true, // Notifications don't need explicit check on older Android
    });

    useEffect(() => {
        checkPermissionsAndStatus();
    }, []);

    const checkPermissionsAndStatus = async () => {
        const [overlayPerm, accessibilityPerm, notificationPerm, running, enabled] = await Promise.all([
            OverlayService.checkOverlayPermission(),
            OverlayService.checkAccessibilityPermission(),
            OverlayService.checkNotificationPermission(),
            OverlayService.isServiceRunning(),
            StorageService.isServiceEnabled(),
        ]);

        setServiceStatus({
            isRunning: running,
            hasOverlayPermission: overlayPerm,
            hasAccessibilityPermission: accessibilityPerm,
            hasNotificationPermission: notificationPerm,
        });
        setIsServiceEnabled(enabled);
    };

    const handleToggleService = async (value: boolean) => {
        if (value) {
            // Check permissions before enabling
            if (!serviceStatus.hasOverlayPermission) {
                Alert.alert(
                    'Permission Required',
                    'ReplyFlow needs permission to display over other apps.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Grant Permission',
                            onPress: () => {
                                OverlayService.requestOverlayPermission();
                                setTimeout(checkPermissionsAndStatus, 1000);
                            },
                        },
                    ]
                );
                return;
            }

            if (!serviceStatus.hasNotificationPermission) {
                Alert.alert(
                    'Notifications Required',
                    'ReplyFlow needs notification permission to run the writing assistant service accurately.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Enable',
                            onPress: () => {
                                OverlayService.requestNotificationPermission();
                                setTimeout(checkPermissionsAndStatus, 1000);
                            },
                        },
                    ]
                );
                return;
            }

            if (!serviceStatus.hasAccessibilityPermission) {
                Alert.alert(
                    'Accessibility Service Required',
                    'ReplyFlow needs accessibility permission to monitor text input across apps. Your privacy is protected - passwords and sensitive information are never captured.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Enable',
                            onPress: () => {
                                OverlayService.requestAccessibilityPermission();
                                setTimeout(checkPermissionsAndStatus, 1000);
                            },
                        },
                    ]
                );
                return;
            }

            // Start service
            const started = await OverlayService.startService();
            if (started) {
                setIsServiceEnabled(true);
                await StorageService.setServiceEnabled(true);
                checkPermissionsAndStatus();
            } else {
                Alert.alert('Error', 'Failed to start service. Please try again.');
            }
        } else {
            // Stop service
            const stopped = await OverlayService.stopService();
            if (stopped) {
                setIsServiceEnabled(false);
                await StorageService.setServiceEnabled(false);
                checkPermissionsAndStatus();
            }
        }
    };

    const PermissionCard = ({
        title,
        granted,
        onPress,
    }: {
        title: string;
        granted: boolean;
        onPress?: () => void;
    }) => (
        <TouchableOpacity
            style={[styles.permissionCard, granted && styles.permissionCardGranted]}
            onPress={onPress}
            disabled={granted}
        >
            <View style={styles.permissionIcon}>
                <Text style={styles.permissionIconText}>{granted ? '✓' : '!'}</Text>
            </View>
            <View style={styles.permissionInfo}>
                <Text style={styles.permissionTitle}>{title}</Text>
                <Text style={styles.permissionStatus}>
                    {granted ? 'Granted' : 'Not Granted'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4285F4" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>ReplyFlow</Text>
                <Text style={styles.headerSubtitle}>AI Writing Assistant</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Master Toggle */}
                <View style={styles.toggleSection}>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.toggleTitle}>Writing Assistant</Text>
                        <Text style={styles.toggleSubtitle}>
                            {isServiceEnabled ? 'Active' : 'Inactive'}
                        </Text>
                    </View>
                    <Switch
                        value={isServiceEnabled}
                        onValueChange={handleToggleService}
                        trackColor={{ false: '#ccc', true: '#4285F4' }}
                        thumbColor={isServiceEnabled ? '#fff' : '#f4f3f4'}
                    />
                </View>

                {/* Service Status */}
                {isServiceEnabled && (
                    <View style={styles.statusCard}>
                        <Text style={styles.statusText}>
                            {serviceStatus.isRunning
                                ? '✓ Service is running'
                                : '⚠ Service is not running'}
                        </Text>
                    </View>
                )}

                {/* Permissions */}
                <Text style={styles.sectionTitle}>Permissions</Text>
                <View style={styles.permissionsGrid}>
                    <PermissionCard
                        title="Display Over Apps"
                        granted={serviceStatus.hasOverlayPermission}
                        onPress={() => {
                            OverlayService.requestOverlayPermission();
                            setTimeout(checkPermissionsAndStatus, 1000);
                        }}
                    />
                    <PermissionCard
                        title="Accessibility Service"
                        granted={serviceStatus.hasAccessibilityPermission}
                        onPress={() => {
                            OverlayService.requestAccessibilityPermission();
                            setTimeout(checkPermissionsAndStatus, 1000);
                        }}
                    />
                    <PermissionCard
                        title="Notifications"
                        granted={serviceStatus.hasNotificationPermission}
                        onPress={() => {
                            OverlayService.requestNotificationPermission();
                            setTimeout(checkPermissionsAndStatus, 1000);
                        }}
                    />
                </View>

                {/* Features */}
                <Text style={styles.sectionTitle}>Features</Text>
                <View style={styles.featuresGrid}>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureIcon}>✓</Text>
                        <Text style={styles.featureTitle}>Grammar Check</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureIcon}>Aa</Text>
                        <Text style={styles.featureTitle}>Spelling</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureIcon}>✨</Text>
                        <Text style={styles.featureTitle}>Rephrase</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureIcon}>🎭</Text>
                        <Text style={styles.featureTitle}>Tone</Text>
                    </View>
                </View>

                {/* Settings Button */}
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => navigation.navigate('Settings' as never)}
                >
                    <Text style={styles.settingsButtonText}>⚙ Settings</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#4285F4',
        padding: 24,
        paddingTop: 48,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    toggleSection: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    toggleInfo: {
        flex: 1,
    },
    toggleTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    toggleSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    statusCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    statusText: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 12,
    },
    permissionsGrid: {
        marginBottom: 24,
    },
    permissionCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#FFC107',
        elevation: 1,
    },
    permissionCardGranted: {
        borderColor: '#4CAF50',
    },
    permissionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    permissionIconText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    permissionInfo: {
        flex: 1,
    },
    permissionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    permissionStatus: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    featureCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        width: '48%',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 1,
    },
    featureIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    settingsButton: {
        backgroundColor: '#4285F4',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    settingsButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});

export default HomeScreen;
