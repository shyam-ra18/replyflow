// This file just imports index.js for Android

import { AppRegistry } from 'react-native';
import './index.js';
import { name as appName } from './app.json';
import App from './App';

// Register main app
AppRegistry.registerComponent(appName, () => App);

