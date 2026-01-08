package com.replyflow

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.content.Context
import android.os.Build
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class TextMonitorService : AccessibilityService() {
    
    companion object {
        var isServiceEnabled = false // System status
        private var isAppEnabled = false    // User preference toggle
        private var reactContext: ReactApplicationContext? = null
        private val hideHandler = android.os.Handler(android.os.Looper.getMainLooper())
        private val HIDE_DELAY = 30000L // 30 seconds
        
        fun setReactContext(context: ReactApplicationContext) {
            reactContext = context
        }

        fun setAppEnabled(enabled: Boolean) {
            isAppEnabled = enabled
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        isServiceEnabled = true
        checkAppEnabled() // Sync state immediately
        
        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED or 
                        AccessibilityEvent.TYPE_VIEW_FOCUSED or
                        AccessibilityEvent.TYPE_VIEW_TEXT_SELECTION_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                   AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
            notificationTimeout = 100
        }
        
        serviceInfo = info
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        
        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED,
            AccessibilityEvent.TYPE_VIEW_TEXT_SELECTION_CHANGED -> {
                handleTextEvent(event)
            }
            AccessibilityEvent.TYPE_VIEW_FOCUSED -> {
                handleFocusEvent(event)
            }
        }
    }

    private fun handleTextEvent(event: AccessibilityEvent) {
        val source = event.source ?: return
        
        try {
            // Filter sensitive fields
            if (isSensitiveField(source)) {
                hideFloatingButton()
                return
            }
            
            val text = when {
                event.text.isNotEmpty() -> event.text.joinToString(" ")
                source.text != null -> source.text.toString()
                else -> ""
            }
            
            if (text.isNotEmpty() && text.length > 3) {
                showFloatingButton()
                sendEventToReactNative("onTextChanged", text)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            try { source.recycle() } catch (e: Exception) {}
        }
    }

    private fun handleFocusEvent(event: AccessibilityEvent) {
        val source = event.source ?: return
        
        try {
            if (isSensitiveField(source)) {
                hideFloatingButton()
                sendEventToReactNative("onSensitiveFieldFocused", "")
                return
            }
            
            val text = source.text?.toString() ?: ""
            if (text.isNotEmpty() && source.isFocused) {
                showFloatingButton()
                sendEventToReactNative("onTextFieldFocused", text)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            try { source.recycle() } catch (e: Exception) {}
        }
    }

    private fun checkAppEnabled(): Boolean {
        if (isAppEnabled) return true
        
        // Try reading from SharedPreferences as a fallback (if app was killed)
        val prefs = getSharedPreferences("replyflow_prefs", Context.MODE_PRIVATE)
        isAppEnabled = prefs.getBoolean("service_enabled", false)
        return isAppEnabled
    }

    private fun showFloatingButton() {
        if (!isServiceEnabled || !checkAppEnabled()) return
        
        // Reset hide timer
        hideHandler.removeCallbacksAndMessages(null)
        hideHandler.postDelayed({
            hideFloatingButton()
        }, HIDE_DELAY)

        val intent = Intent(this, FloatingButtonService::class.java).apply {
            action = FloatingButtonService.ACTION_SHOW
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun hideFloatingButton() {
        val intent = Intent(this, FloatingButtonService::class.java).apply {
            action = FloatingButtonService.ACTION_HIDE
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun isSensitiveField(node: AccessibilityNodeInfo): Boolean {
        // Check if it's a password field
        if (node.isPassword) {
            return true
        }
        
        // Check class name for password or sensitive fields
        val className = node.className?.toString()?.lowercase() ?: ""
        if (className.contains("password") || 
            className.contains("pin") || 
            className.contains("otp")) {
            return true
        }
        
        // Check content description
        val contentDesc = node.contentDescription?.toString()?.lowercase() ?: ""
        if (contentDesc.contains("password") || 
            contentDesc.contains("pin") ||
            contentDesc.contains("credit card") ||
            contentDesc.contains("cvv") ||
            contentDesc.contains("otp")) {
            return true
        }
        
        // Check view ID
        val viewId = node.viewIdResourceName?.lowercase() ?: ""
        if (viewId.contains("password") || 
            viewId.contains("pin") ||
            viewId.contains("card") ||
            viewId.contains("cvv") ||
            viewId.contains("otp")) {
            return true
        }
        
        return false
    }

    private fun sendEventToReactNative(eventName: String, data: String) {
        try {
            reactContext?.let { context ->
                if (context.hasActiveCatalystInstance()) {
                    val params = Arguments.createMap().apply {
                        putString("text", data)
                        putLong("timestamp", System.currentTimeMillis())
                    }
                    
                    context
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit(eventName, params)
                }
            }
        } catch (e: Exception) {
            // React Native environment is not active
        }
    }

    override fun onInterrupt() {
        isServiceEnabled = false
        hideFloatingButton()
    }

    override fun onDestroy() {
        super.onDestroy()
        isServiceEnabled = false
        hideFloatingButton()
    }
}
