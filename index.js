/**
 * @format
 */

import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import KeyboardView from './src/components/KeyboardView';
import { name as appName } from './app.json';

// Register main app
AppRegistry.registerComponent(appName, () => App);

// Register keyboard component
AppRegistry.registerComponent('SmartTypeKeyboard', () => KeyboardView);
