package com.replyflow.modules

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.replyflow.keyboard.SmartTypeKeyboardService

class KeyboardModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        const val NAME = "KeyboardModule"
        private var reactContext: ReactApplicationContext? = null
        
        fun sendEvent(eventName: String, params: WritableMap?) {
            reactContext?.let { context ->
                context
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(eventName, params)
            }
        }
    }
    
    init {
        KeyboardModule.reactContext = reactContext
    }
    
    override fun getName(): String = NAME
    
    @ReactMethod
    fun openKeyboardSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun isKeyboardEnabled(promise: Promise) {
        try {
            val enabledIMEs = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.ENABLED_INPUT_METHODS
            )
            val isEnabled = enabledIMEs?.contains(reactApplicationContext.packageName) == true
            promise.resolve(isEnabled)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun isDefaultKeyboard(promise: Promise) {
        try {
            val currentIME = Settings.Secure.getString(
                reactApplicationContext.contentResolver,
                Settings.Secure.DEFAULT_INPUT_METHOD
            )
            val isDefault = currentIME?.contains(reactApplicationContext.packageName) == true
            promise.resolve(isDefault)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun getCurrentText(promise: Promise) {
        val service = SmartTypeKeyboardService.getInstance()
        if (service != null) {
            val text = service.getCurrentTextFromModule()
            promise.resolve(text)
        } else {
            promise.reject("ERROR", "No active keyboard service")
        }
    }
    
    @ReactMethod
    fun insertText(text: String) {
        SmartTypeKeyboardService.getInstance()?.insertTextFromModule(text)
    }
    
    @ReactMethod
    fun deleteText(count: Int) {
        SmartTypeKeyboardService.getInstance()?.deleteTextFromModule(count)
    }
    
    @ReactMethod
    fun replaceText(start: Int, end: Int, text: String) {
        SmartTypeKeyboardService.getInstance()?.replaceTextFromModule(start, end, text)
    }
    
    @ReactMethod
    fun commitText(text: String) {
        SmartTypeKeyboardService.getInstance()?.insertTextFromModule(text)
    }
    
    @ReactMethod
    fun getInputType(promise: Promise) {
        val service = SmartTypeKeyboardService.getInstance()
        if (service != null) {
            val inputType = service.getInputTypeFromModule()
            promise.resolve(inputType)
        } else {
            promise.reject("ERROR", "No active keyboard service")
        }
    }
    
    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RCTDeviceEventEmitter
    }
    
    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RCTDeviceEventEmitter
    }
}
