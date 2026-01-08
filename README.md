# ReplyFlow - AI Writing Assistant

A Grammarly-style writing assistant app for Android built with React Native. Features system-wide text monitoring and AI-powered suggestions using Google Gemini API.

## Features

- ✨ **System-Wide Overlay**: Floating button appears over all apps
- 🎯 **Smart Text Monitoring**: Accessibility service monitors text input (with privacy protection)
- 🤖 **AI-Powered Suggestions**:
  - Grammar checking
  - Spelling correction
  - Text rephrasing (multiple tones)
  - Tone adjustment
  - Text shortening/expansion
- 🔒 **Privacy First**: Passwords and sensitive fields are never captured
- 📱 **Native Performance**: Smooth 60 FPS draggable overlay

## Prerequisites

- Node.js 18+
- React Native development environment set up
- Android SDK (API 29+)
- Physical Android device (Android 10+) for testing
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation

### 1. Install Dependencies

```bash
yarn install
```

### 2. Install Pods (if on macOS)

```bash
cd ios && pod install && cd ..
```

### 3. Build and Run

```bash
# Start Metro bundler
yarn start

# In another terminal, run on Android
yarn android
```

## Setup Instructions

### 1. Grant Permissions

When you first open the app:

1. **Display Over Apps**: Required for the floating button
   - Tap "Grant Permission" on the home screen
   - Enable "Display over other apps" in system settings

2. **Accessibility Service**: Required for text monitoring
   - Tap "Enable" on the home screen
   - Find "ReplyFlow" in accessibility settings
   - Enable the service

3. **Notifications** (Android 13+): Automatically requested

### 2. Configure API Key

1. Go to Settings (⚙ button on home screen)
2. Enter your Google Gemini API key
3. Tap "Save"
4. Tap "Test API" to verify it works

### 3. Enable Service

1. Return to home screen
2. Toggle "Writing Assistant" ON
3. You should see a notification "ReplyFlow Active"
4. The floating button will appear on your screen

## Usage

1. **Open any app** (WhatsApp, Gmail, Notes, etc.)
2. **Start typing** in a text field
3. **Tap the floating button** when you want suggestions
4. **Select a tab** (Grammar, Spelling, Rephrase, Tone, Length)
5. **Review the suggestion** and tap "Apply" to copy it
6. **Paste** the suggestion in your target app

## Project Structure

```
replyflow/
├── android/
│   └── app/src/main/
│       ├── java/com/replyflow/
│       │   ├── FloatingButtonService.kt    # Foreground service
│       │   ├── TextMonitorService.kt       # Accessibility service
│       │   ├── OverlayModule.kt            # React Native bridge
│       │   └── OverlayPackage.kt           # Package registration
│       └── res/
│           ├── layout/
│           │   └── floating_button_layout.xml
│           ├── drawable/
│           │   └── floating_button_background.xml
│           └── xml/
│               └── accessibility_service_config.xml
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx                  # Main dashboard
│   │   └── SettingsScreen.tsx              # Settings & API config
│   ├── components/
│   │   └── SuggestionBottomSheet.tsx       # AI suggestions modal
│   ├── services/
│   │   ├── GeminiService.ts                # AI integration
│   │   ├── OverlayService.ts               # Native module wrapper
│   │   └── StorageService.ts               # Persistent storage
│   └── types/
│       └── index.ts                        # TypeScript types
└── App.tsx                                 # Main app component
```

## Native Modules

### FloatingButtonService
- Foreground service that manages the overlay window
- Creates draggable floating button
- Sends click events to React Native

### TextMonitorService
- Accessibility service for text monitoring
- Filters sensitive fields (passwords, credit cards)
- Sends text events to React Native

### OverlayModule
- React Native bridge for native functionality
- Permission checks and requests
- Service lifecycle management
- Event emitter for native-to-JS communication

## Privacy & Security

- **No Data Collection**: Text is processed locally and via Gemini API only
- **Sensitive Field Filtering**: Passwords, credit cards, OTPs are never captured
- **User Control**: Service can be disabled anytime
- **Transparent**: Open source code for review

## Troubleshooting

### Floating button doesn't appear
- Check if "Display over apps" permission is granted
- Ensure service is enabled (toggle ON)
- Check notification tray for "ReplyFlow Active"

### Text not being captured
- Enable accessibility service in system settings
- Grant all required permissions
- Restart the app

### AI suggestions not working
- Verify API key is correct in Settings
- Test API connection in Settings
- Check internet connection
- Review Metro bundler logs for errors

### Build errors
```bash
# Clean build
cd android && ./gradlew clean && cd ..
yarn android
```

## Development

### Running in Development Mode

```bash
# Start Metro
yarn start

# Run on Android
yarn android

# View logs
yarn android --verbose
```

### Debugging Native Code

1. Open `android/` folder in Android Studio
2. Attach debugger to running app
3. Set breakpoints in Kotlin files
4. Use Logcat for native logs

## Known Limitations

- **Apply Suggestion**: Currently copies to clipboard (full paste automation requires additional permissions)
- **iOS Support**: Not implemented (requires different approach)
- **Offline Mode**: Requires internet for AI features

## Future Enhancements

- [ ] Auto-paste suggestions using accessibility service
- [ ] Offline grammar/spelling check
- [ ] Custom AI prompts
- [ ] Suggestion history
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Widget support

## License

MIT

## Credits

Built with:
- React Native
- Google Gemini AI
- @gorhom/bottom-sheet
- React Navigation

---

**Note**: This app requires a physical Android device for testing. Overlay and accessibility features don't work properly on emulators.
