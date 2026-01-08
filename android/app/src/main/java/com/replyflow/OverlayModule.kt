package com.replyflow

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class OverlayModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val clickReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            sendEventToReactNative("onFloatingButtonClicked", null)
        }
    }
    
    init {
        TextMonitorService.setReactContext(reactContext)
        
        // Sync app enabled state
        val prefs = reactContext.getSharedPreferences("replyflow_prefs", Context.MODE_PRIVATE)
        val isEnabled = prefs.getBoolean("service_enabled", false)
        TextMonitorService.setAppEnabled(isEnabled)

        if (isEnabled) {
            val intent = Intent(reactContext, FloatingButtonService::class.java).apply {
                action = FloatingButtonService.ACTION_HIDE
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
        }

        // Register broadcast receiver for floating button clicks
        val filter = IntentFilter("com.replyflow.FLOATING_BUTTON_CLICKED")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(clickReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            reactContext.registerReceiver(clickReceiver, filter)
        }
    }

    override fun getName(): String {
        return "OverlayModule"
    }

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val hasPermission = Settings.canDrawOverlays(reactApplicationContext)
                promise.resolve(hasPermission)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestOverlayPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!Settings.canDrawOverlays(reactApplicationContext)) {
                    val intent = Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:${reactApplicationContext.packageName}")
                    ).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    reactApplicationContext.startActivity(intent)
                }
            }
        } catch (e: Exception) {
            sendEventToReactNative("onPermissionError", e.message)
        }
    }

    @ReactMethod
    fun startFloatingService(promise: Promise) {
        try {
            TextMonitorService.setAppEnabled(true)
            saveServiceState(true)
            val intent = Intent(reactApplicationContext, FloatingButtonService::class.java).apply {
                action = FloatingButtonService.ACTION_SHOW
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactApplicationContext.startForegroundService(intent)
            } else {
                reactApplicationContext.startService(intent)
            }
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopFloatingService(promise: Promise) {
        try {
            TextMonitorService.setAppEnabled(false)
            saveServiceState(false)
            val intent = Intent(reactApplicationContext, FloatingButtonService::class.java).apply {
                action = FloatingButtonService.ACTION_HIDE
            }
            reactApplicationContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun saveServiceState(enabled: Boolean) {
        val prefs = reactApplicationContext.getSharedPreferences("replyflow_prefs", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("service_enabled", enabled).apply()
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        try {
            promise.resolve(FloatingButtonService.isServiceRunning)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun checkAccessibilityPermission(promise: Promise) {
        try {
            promise.resolve(TextMonitorService.isServiceEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun checkNotificationPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val hasPermission = ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
                promise.resolve(hasPermission)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestNotificationPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(Settings.EXTRA_APP_PACKAGE, reactApplicationContext.packageName)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactApplicationContext.startActivity(intent)
            }
        } catch (e: Exception) {
            sendEventToReactNative("onPermissionError", e.message)
        }
    }

    @ReactMethod
    fun requestAccessibilityPermission() {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            sendEventToReactNative("onPermissionError", e.message)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for NativeEventEmitter
    }

    private fun sendEventToReactNative(eventName: String, data: Any?) {
        try {
            val params = if (data is String) {
                Arguments.createMap().apply {
                    putString("data", data)
                }
            } else {
                Arguments.createMap()
            }
            
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            // React Native might not be ready
        }
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        try {
            reactApplicationContext.unregisterReceiver(clickReceiver)
        } catch (e: Exception) {
            // Receiver might not be registered
        }
    }
}
