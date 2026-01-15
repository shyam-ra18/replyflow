import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { useSettingsStore } from './src/store/useSettingsStore';
import KeyboardAIService from './src/services/KeyboardAIService';

const Stack = createNativeStackNavigator();

const App = () => {
  const loadSettings = useSettingsStore(state => state.loadSettings);

  useEffect(() => {
    // Load saved settings on app start
    loadSettings();

    // Initialize keyboard AI service to handle AI actions from native keyboard
    KeyboardAIService.initialize();

    return () => {
      KeyboardAIService.destroy();
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4A90E2',
            },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'SmartType AI Keyboard' }}
          />
          <Stack.Screen
            name="Setup"
            component={SetupScreen}
            options={{ title: 'Setup Keyboard' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default App;
