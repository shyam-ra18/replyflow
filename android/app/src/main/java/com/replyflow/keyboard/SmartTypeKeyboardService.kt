package com.replyflow.keyboard

import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.KeyEvent
import android.view.LayoutInflater
import android.widget.Button
import android.widget.LinearLayout
import android.os.Vibrator
import android.os.VibrationEffect
import android.content.Context
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.replyflow.R
import com.replyflow.modules.KeyboardModule
import java.lang.ref.WeakReference

class SmartTypeKeyboardService : InputMethodService() {
    
    private lateinit var keyboardContainer: ViewGroup
    private lateinit var lettersLayout: View
    private lateinit var numbersLayout: View
    private lateinit var symbolsLayout: View
    private var currentLayout = 0 // 0 = letters, 1 = numbers, 2 = symbols
    private var isShiftActive = false
    private var isCapsLock = false
    private var vibrator: Vibrator? = null
    
    companion object {
        private var instance: WeakReference<SmartTypeKeyboardService>? = null
        const val LAYOUT_LETTERS = 0
        const val LAYOUT_NUMBERS = 1
        const val LAYOUT_SYMBOLS = 2
        
        fun getInstance(): SmartTypeKeyboardService? {
            return instance?.get()
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        instance = WeakReference(this)
        vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
    
    override fun onCreateInputView(): View {
        // Create container for all layouts
        keyboardContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        
        // Inflate all keyboard layouts
        val inflater = LayoutInflater.from(this)
        lettersLayout = inflater.inflate(R.layout.keyboard_letters, keyboardContainer, false)
        numbersLayout = inflater.inflate(R.layout.keyboard_numbers, keyboardContainer, false)
        symbolsLayout = inflater.inflate(R.layout.keyboard_symbols, keyboardContainer, false)
        
        // Setup all layouts
        setupLettersLayout()
        setupNumbersLayout()
        setupSymbolsLayout()
        
        // Start with letters layout
        keyboardContainer.addView(lettersLayout)
        currentLayout = LAYOUT_LETTERS
        
        // Enable hardware acceleration
        keyboardContainer.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        
        return keyboardContainer
    }
    
    private fun switchToLayout(layout: Int) {
        keyboardContainer.removeAllViews()
        when (layout) {
            LAYOUT_LETTERS -> keyboardContainer.addView(lettersLayout)
            LAYOUT_NUMBERS -> keyboardContainer.addView(numbersLayout)
            LAYOUT_SYMBOLS -> keyboardContainer.addView(symbolsLayout)
        }
        currentLayout = layout
    }
    
    private fun setupLettersLayout() {
        // Letter keys - QWERTY layout
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
            lettersLayout.findViewById<Button>(id)?.setOnClickListener {
                vibrateKey()
                val text = if (isShiftActive || isCapsLock) letter.uppercase() else letter
                // Use getCurrentInputConnection() - the correct way!
                currentInputConnection?.commitText(text, 1)
                if (isShiftActive && !isCapsLock) {
                    isShiftActive = false
                    updateShiftKeyVisual()
                }
            }
        }
        
        // Shift key - single tap for shift, double tap for caps lock
        val shiftButton = lettersLayout.findViewById<Button>(R.id.key_shift)
        var lastShiftTime = 0L
        shiftButton?.setOnClickListener {
            vibrateKey()
            val now = System.currentTimeMillis()
            if (now - lastShiftTime < 300) {
                // Double tap - toggle caps lock
                isCapsLock = !isCapsLock
                isShiftActive = isCapsLock
            } else {
                // Single tap - toggle shift
                if (isCapsLock) {
                    isCapsLock = false
                    isShiftActive = false
                } else {
                    isShiftActive = !isShiftActive
                }
            }
            lastShiftTime = now
            updateShiftKeyVisual()
        }
        
        // Backspace key
        val backspaceButton = lettersLayout.findViewById<Button>(R.id.key_backspace)
        backspaceButton?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.deleteSurroundingText(1, 0)
        }
        // Long press backspace to delete word
        backspaceButton?.setOnLongClickListener {
            vibrateKey()
            currentInputConnection?.deleteSurroundingText(20, 0)
            true
        }
        
        // Space key
        lettersLayout.findViewById<Button>(R.id.key_space)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.commitText(" ", 1)
        }
        
        // Enter key
        lettersLayout.findViewById<Button>(R.id.key_enter)?.setOnClickListener {
            vibrateKey()
            val ic = currentInputConnection
            if (ic != null) {
                // Send enter key event
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER))
            }
        }
        
        // 123 key - switch to numbers
        lettersLayout.findViewById<Button>(R.id.key_numbers)?.setOnClickListener {
            vibrateKey()
            switchToLayout(LAYOUT_NUMBERS)
        }
    }
    
    private fun setupNumbersLayout() {
        // Number keys
        val numberKeys = mapOf(
            R.id.key_1 to "1", R.id.key_2 to "2", R.id.key_3 to "3",
            R.id.key_4 to "4", R.id.key_5 to "5", R.id.key_6 to "6",
            R.id.key_7 to "7", R.id.key_8 to "8", R.id.key_9 to "9",
            R.id.key_0 to "0"
        )
        
        numberKeys.forEach { (id, num) ->
            numbersLayout.findViewById<Button>(id)?.setOnClickListener {
                vibrateKey()
                currentInputConnection?.commitText(num, 1)
            }
        }
        
        // Symbol keys
        val symbolKeys = mapOf(
            R.id.key_minus to "-", R.id.key_slash to "/", R.id.key_colon to ":",
            R.id.key_semicolon to ";", R.id.key_lparen to "(", R.id.key_rparen to ")",
            R.id.key_dollar to "$", R.id.key_amp to "&", R.id.key_at to "@",
            R.id.key_quote to "\"", R.id.key_dot to ".", R.id.key_comma to ",",
            R.id.key_question to "?", R.id.key_exclaim to "!", R.id.key_apostrophe to "'"
        )
        
        symbolKeys.forEach { (id, sym) ->
            numbersLayout.findViewById<Button>(id)?.setOnClickListener {
                vibrateKey()
                currentInputConnection?.commitText(sym, 1)
            }
        }
        
        // ABC key - switch to letters
        numbersLayout.findViewById<Button>(R.id.key_abc)?.setOnClickListener {
            vibrateKey()
            switchToLayout(LAYOUT_LETTERS)
        }
        
        // #+= key - switch to symbols
        numbersLayout.findViewById<Button>(R.id.key_symbols)?.setOnClickListener {
            vibrateKey()
            switchToLayout(LAYOUT_SYMBOLS)
        }
        
        // Backspace
        numbersLayout.findViewById<Button>(R.id.key_backspace)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.deleteSurroundingText(1, 0)
        }
        
        // Space
        numbersLayout.findViewById<Button>(R.id.key_space)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.commitText(" ", 1)
        }
        
        // Enter
        numbersLayout.findViewById<Button>(R.id.key_enter)?.setOnClickListener {
            vibrateKey()
            val ic = currentInputConnection
            if (ic != null) {
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER))
            }
        }
    }
    
    private fun setupSymbolsLayout() {
        // Extended symbol keys
        val extSymbolKeys = mapOf(
            R.id.key_lbracket to "[", R.id.key_rbracket to "]",
            R.id.key_lbrace to "{", R.id.key_rbrace to "}",
            R.id.key_hash to "#", R.id.key_percent to "%",
            R.id.key_caret to "^", R.id.key_asterisk to "*",
            R.id.key_plus to "+", R.id.key_equals to "=",
            R.id.key_underscore to "_", R.id.key_backslash to "\\",
            R.id.key_pipe to "|", R.id.key_tilde to "~",
            R.id.key_lt to "<", R.id.key_gt to ">",
            R.id.key_dot to ".", R.id.key_comma to ",",
            R.id.key_question to "?", R.id.key_exclaim to "!",
            R.id.key_apostrophe to "'"
        )
        
        extSymbolKeys.forEach { (id, sym) ->
            symbolsLayout.findViewById<Button>(id)?.setOnClickListener {
                vibrateKey()
                currentInputConnection?.commitText(sym, 1)
            }
        }
        
        // ABC key
        symbolsLayout.findViewById<Button>(R.id.key_abc)?.setOnClickListener {
            vibrateKey()
            switchToLayout(LAYOUT_LETTERS)
        }
        
        // 123 key
        symbolsLayout.findViewById<Button>(R.id.key_123)?.setOnClickListener {
            vibrateKey()
            switchToLayout(LAYOUT_NUMBERS)
        }
        
        // Backspace
        symbolsLayout.findViewById<Button>(R.id.key_backspace)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.deleteSurroundingText(1, 0)
        }
        
        // Space
        symbolsLayout.findViewById<Button>(R.id.key_space)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.commitText(" ", 1)
        }
        
        // Enter
        symbolsLayout.findViewById<Button>(R.id.key_enter)?.setOnClickListener {
            vibrateKey()
            val ic = currentInputConnection
            if (ic != null) {
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER))
            }
        }
    }
    
    private fun updateShiftKeyVisual() {
        val shiftButton = lettersLayout.findViewById<Button>(R.id.key_shift)
        shiftButton?.text = when {
            isCapsLock -> "⇪"
            isShiftActive -> "⬆"
            else -> "⇧"
        }
    }
    
    private fun vibrateKey() {
        try {
            vibrator?.vibrate(VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE))
        } catch (e: Exception) {
            // Ignore vibration errors
        }
    }
    
    override fun onStartInput(attribute: EditorInfo?, restarting: Boolean) {
        super.onStartInput(attribute, restarting)
        
        // Notify React Native about input start
        val params = Arguments.createMap()
        params.putString("inputType", attribute?.inputType.toString())
        params.putString("packageName", attribute?.packageName)
        params.putString("fieldId", attribute?.fieldId.toString())
        
        sendEventToReactNative("onInputStart", params)
    }
    
    override fun onFinishInput() {
        super.onFinishInput()
        sendEventToReactNative("onInputFinish", null)
    }
    
    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        
        // Always switch to letters layout when keyboard opens
        if (currentLayout != LAYOUT_LETTERS) {
            switchToLayout(LAYOUT_LETTERS)
        }
        
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
