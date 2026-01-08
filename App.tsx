import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SuggestionBottomSheet from './src/components/SuggestionBottomSheet';
import OverlayService from './src/services/OverlayService';
import { Alert } from 'react-native';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [capturedText, setCapturedText] = useState('');

  useEffect(() => {
    // Listen for floating button clicks
    const unsubscribeClick = OverlayService.onFloatingButtonClicked(() => {
      console.log('Floating button clicked!');
      setShowBottomSheet(true);
    });

    // Listen for text changes
    const unsubscribeText = OverlayService.onTextChanged((data) => {
      console.log('Text changed:', data.text);
      setCapturedText(data.text);
    });

    // Listen for text field focused
    const unsubscribeFocus = OverlayService.onTextFieldFocused((data) => {
      console.log('Text field focused:', data.text);
      setCapturedText(data.text);
    });

    return () => {
      unsubscribeClick();
      unsubscribeText();
      unsubscribeFocus();
    };
  }, []);

  const handleApplySuggestion = (text: string) => {
    // Copy to clipboard for now
    // In a full implementation, you would use accessibility service to paste
    Alert.alert(
      'Suggestion Applied',
      'The suggestion has been copied to your clipboard. You can now paste it in the target app.',
      [{ text: 'OK' }]
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4285F4',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'ReplyFlow' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Modal for Suggestions */}
      <SuggestionBottomSheet
        isVisible={showBottomSheet}
        capturedText={capturedText}
        onClose={() => setShowBottomSheet(false)}
        onApply={handleApplySuggestion}
      />
    </GestureHandlerRootView>
  );
}

export default App;
