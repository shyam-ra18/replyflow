package com.replyflow.keyboard

import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.KeyEvent
import android.view.LayoutInflater
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.replyflow.R
import com.replyflow.modules.KeyboardModule
import com.replyflow.MainApplication
import java.lang.ref.WeakReference

class SmartTypeKeyboardService : InputMethodService() {
    
    private lateinit var keyboardView: View
    private var currentInputConnection: InputConnection? = null
    
    companion object {
        private var instance: WeakReference<SmartTypeKeyboardService>? = null
        
        fun getInstance(): SmartTypeKeyboardService? {
            return instance?.get()
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        instance = WeakReference(this)
    }
    
    override fun onCreateInputView(): View {
        // Use native XML layout instead of React Native
        keyboardView = LayoutInflater.from(this).inflate(R.layout.keyboard_view, null)
        
        // Enable hardware acceleration for 60fps
        keyboardView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        
        // Setup key listeners
        setupKeyListeners()
        
        return keyboardView
    }
    
    override fun onStartInput(attribute: EditorInfo?, restarting: Boolean) {
        super.onStartInput(attribute, restarting)
        currentInputConnection = currentInputConnection
        
        // Notify React Native about input start
        val params = Arguments.createMap()
        params.putString("inputType", attribute?.inputType.toString())
        params.putString("packageName", attribute?.packageName)
        params.putString("fieldId", attribute?.fieldId.toString())
        
        sendEventToReactNative("onInputStart", params)
    }
    
    override fun onFinishInput() {
        super.onFinishInput()
        currentInputConnection = null
        sendEventToReactNative("onInputFinish", null)
    }
    
    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        
        // Detect if this is a password field
        val isPassword = info?.inputType?.let { inputType ->
            val typeClass = inputType and android.text.InputType.TYPE_MASK_CLASS
            val typeVariation = inputType and android.text.InputType.TYPE_MASK_VARIATION
            
            typeClass == android.text.InputType.TYPE_CLASS_TEXT &&
            (typeVariation == android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD ||
             typeVariation == android.text.InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD ||
             typeVariation == android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD)
        } ?: false
        
        val params = Arguments.createMap()
        params.putBoolean("isPassword", isPassword)
        sendEventToReactNative("onInputViewStart", params)
    }
    
    private fun setupKeyListeners() {
        var isShiftActive = false
        
        // Letter keys
        val letterKeys = mapOf(
            R.id.key_q to "q", R.id.key_w to "w", R.id.key_e to "e",
            R.id.key_r to "r", R.id.key_t to "t", R.id.key_y to "y",
            R.id.key_u to "u", R.id.key_i to "i", R.id.key_o to "o",
            R.id.key_p to "p", R.id.key_a to "a", R.id.key_s to "s",
            R.id.key_d to "d", R.id.key_f to "f", R.id.key_g to "g",
            R.id.key_h to "h", R.id.key_j to "j", R.id.key_k to "k",
            R.id.key_l to "l", R.id.key_z to "z", R.id.key_x to "x",
            R.id.key_c to "c", R.id.key_v to "v", R.id.key_b to "b",
            R.id.key_n to "n", R.id.key_m to "m"
        )
        
        letterKeys.forEach { (id, letter) ->
            keyboardView.findViewById<android.widget.Button>(id)?.setOnClickListener {
                val text = if (isShiftActive) letter.uppercase() else letter
                currentInputConnection?.commitText(text, 1)
                if (isShiftActive) isShiftActive = false
            }
        }
        
        // Shift key
        keyboardView.findViewById<android.widget.Button>(R.id.key_shift)?.setOnClickListener {
            isShiftActive = !isShiftActive
        }
        
        // Backspace key
        keyboardView.findViewById<android.widget.Button>(R.id.key_backspace)?.setOnClickListener {
            currentInputConnection?.deleteSurroundingText(1, 0)
        }
        
        // Space key
        keyboardView.findViewById<android.widget.Button>(R.id.key_space)?.setOnClickListener {
            currentInputConnection?.commitText(" ", 1)
        }
        
        // Enter key
        keyboardView.findViewById<android.widget.Button>(R.id.key_enter)?.setOnClickListener {
            currentInputConnection?.sendKeyEvent(
                android.view.KeyEvent(android.view.KeyEvent.ACTION_DOWN, android.view.KeyEvent.KEYCODE_ENTER)
            )
        }
    }
    
    // Public methods for KeyboardModule to call
    fun insertTextFromModule(text: String) {
        currentInputConnection?.commitText(text, 1)
    }
    
    fun deleteTextFromModule(count: Int) {
        currentInputConnection?.deleteSurroundingText(count, 0)
    }
    
    fun replaceTextFromModule(start: Int, end: Int, text: String) {
        currentInputConnection?.let { ic ->
            ic.setSelection(start, end)
            ic.commitText(text, 1)
        }
    }
    
    fun getCurrentTextFromModule(): String {
        return try {
            val extractedText = currentInputConnection?.getExtractedText(
                android.view.inputmethod.ExtractedTextRequest(), 0
            )
            extractedText?.text?.toString() ?: ""
        } catch (e: Exception) {
            ""
        }
    }
    
    fun getInputTypeFromModule(): Int {
        return currentInputEditorInfo?.inputType ?: 0
    }
    
    private fun sendEventToReactNative(eventName: String, params: WritableMap?) {
        try {
            KeyboardModule.sendEvent(eventName, params)
        } catch (e: Exception) {
            // React Native context might not be ready
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }
}
