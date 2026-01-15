package com.replyflow.keyboard

import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputConnection
import android.view.KeyEvent
import android.view.LayoutInflater
import android.widget.Button
import android.widget.TextView
import android.widget.LinearLayout
import android.widget.PopupWindow
import android.os.Vibrator
import android.os.VibrationEffect
import android.content.Context
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.replyflow.R
import com.replyflow.modules.KeyboardModule
import java.lang.ref.WeakReference

class SmartTypeKeyboardService : InputMethodService() {
    
    private var keyboardContainer: LinearLayout? = null
    private var aiToolbar: View? = null
    private var suggestionBar: View? = null
    private var lettersLayout: View? = null
    private var numbersLayout: View? = null
    private var symbolsLayout: View? = null
    private var currentLayout = 0
    private var isShiftActive = false
    private var isCapsLock = false
    private var vibrator: Vibrator? = null
    private var tonePopup: PopupWindow? = null
    private val handler = Handler(Looper.getMainLooper())
    private var typingRunnable: Runnable? = null
    private var isViewInitialized = false
    
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
        val inflater = LayoutInflater.from(this)
        
        // Create main container
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        keyboardContainer = container
        
        // Inflate AI toolbar
        aiToolbar = inflater.inflate(R.layout.ai_toolbar, container, false)
        setupAIToolbar()
        
        // Inflate suggestion bar
        suggestionBar = inflater.inflate(R.layout.suggestion_bar, container, false)
        setupSuggestionBar()
        
        // Inflate keyboard layouts
        lettersLayout = inflater.inflate(R.layout.keyboard_letters, container, false)
        numbersLayout = inflater.inflate(R.layout.keyboard_numbers, container, false)
        symbolsLayout = inflater.inflate(R.layout.keyboard_symbols, container, false)
        
        // Setup all layouts
        setupLettersLayout()
        setupNumbersLayout()
        setupSymbolsLayout()
        
        // Add views to container
        container.addView(aiToolbar)
        container.addView(suggestionBar)
        container.addView(lettersLayout)
        currentLayout = LAYOUT_LETTERS
        
        // Enable hardware acceleration
        container.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        
        isViewInitialized = true
        return container
    }
    
    private fun setupAIToolbar() {
        val toolbar = aiToolbar ?: return
        
        toolbar.findViewById<Button>(R.id.btn_tone)?.setOnClickListener {
            vibrateKey()
            showTonePicker()
        }
        
        toolbar.findViewById<Button>(R.id.btn_expand)?.setOnClickListener {
            vibrateKey()
            triggerAIAction("expand")
        }
        
        toolbar.findViewById<Button>(R.id.btn_summarize)?.setOnClickListener {
            vibrateKey()
            triggerAIAction("summarize")
        }
        
        toolbar.findViewById<Button>(R.id.btn_replies)?.setOnClickListener {
            vibrateKey()
            triggerAIAction("replies")
        }
    }
    
    private fun setupSuggestionBar() {
        val bar = suggestionBar ?: return
        
        bar.findViewById<TextView>(R.id.suggestion_1)?.setOnClickListener {
            vibrateKey()
            insertSuggestion((it as TextView).text.toString())
        }
        bar.findViewById<TextView>(R.id.suggestion_2)?.setOnClickListener {
            vibrateKey()
            insertSuggestion((it as TextView).text.toString())
        }
        bar.findViewById<TextView>(R.id.suggestion_3)?.setOnClickListener {
            vibrateKey()
            insertSuggestion((it as TextView).text.toString())
        }
    }
    
    private fun insertSuggestion(text: String) {
        currentInputConnection?.commitText("$text ", 1)
        hideSuggestions()
    }
    
    fun showSuggestions(suggestions: List<String>) {
        if (!isViewInitialized) return
        val bar = suggestionBar ?: return
        
        handler.post {
            bar.findViewById<TextView>(R.id.suggestion_hint)?.visibility = View.GONE
            
            val chip1 = bar.findViewById<TextView>(R.id.suggestion_1)
            val chip2 = bar.findViewById<TextView>(R.id.suggestion_2)
            val chip3 = bar.findViewById<TextView>(R.id.suggestion_3)
            
            if (suggestions.isNotEmpty()) {
                chip1?.text = suggestions[0]
                chip1?.visibility = View.VISIBLE
            } else {
                chip1?.visibility = View.GONE
            }
            
            if (suggestions.size > 1) {
                chip2?.text = suggestions[1]
                chip2?.visibility = View.VISIBLE
            } else {
                chip2?.visibility = View.GONE
            }
            
            if (suggestions.size > 2) {
                chip3?.text = suggestions[2]
                chip3?.visibility = View.VISIBLE
            } else {
                chip3?.visibility = View.GONE
            }
        }
    }
    
    private fun hideSuggestions() {
        if (!isViewInitialized) return
        val bar = suggestionBar ?: return
        
        handler.post {
            bar.findViewById<TextView>(R.id.suggestion_1)?.visibility = View.GONE
            bar.findViewById<TextView>(R.id.suggestion_2)?.visibility = View.GONE
            bar.findViewById<TextView>(R.id.suggestion_3)?.visibility = View.GONE
            bar.findViewById<TextView>(R.id.suggestion_hint)?.visibility = View.VISIBLE
        }
    }
    
    private fun showTonePicker() {
        val toolbar = aiToolbar ?: return
        val inflater = LayoutInflater.from(this)
        val toneView = inflater.inflate(R.layout.tone_picker, null)
        
        tonePopup = PopupWindow(
            toneView,
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            true
        )
        
        toneView.findViewById<Button>(R.id.tone_professional)?.setOnClickListener {
            applyTone("professional")
            tonePopup?.dismiss()
        }
        toneView.findViewById<Button>(R.id.tone_casual)?.setOnClickListener {
            applyTone("casual")
            tonePopup?.dismiss()
        }
        toneView.findViewById<Button>(R.id.tone_confident)?.setOnClickListener {
            applyTone("confident")
            tonePopup?.dismiss()
        }
        toneView.findViewById<Button>(R.id.tone_empathetic)?.setOnClickListener {
            applyTone("empathetic")
            tonePopup?.dismiss()
        }
        toneView.findViewById<Button>(R.id.tone_concise)?.setOnClickListener {
            applyTone("concise")
            tonePopup?.dismiss()
        }
        
        tonePopup?.showAsDropDown(toolbar)
    }
    
    private fun applyTone(tone: String) {
        val currentText = getCurrentTextFromModule()
        if (currentText.isNotEmpty()) {
            val params = Arguments.createMap()
            params.putString("action", "tone")
            params.putString("tone", tone)
            params.putString("text", currentText)
            sendEventToReactNative("onAIAction", params)
        }
    }
    
    private fun triggerAIAction(action: String) {
        val currentText = getCurrentTextFromModule()
        val params = Arguments.createMap()
        params.putString("action", action)
        params.putString("text", currentText)
        sendEventToReactNative("onAIAction", params)
    }
    
    fun updateSuggestions(suggestions: List<String>) {
        showSuggestions(suggestions)
    }
    
    fun replaceWithAIResponse(newText: String) {
        currentInputConnection?.let { ic ->
            ic.performContextMenuAction(android.R.id.selectAll)
            ic.commitText(newText, 1)
        }
    }
    
    private fun switchToLayout(layout: Int) {
        val container = keyboardContainer ?: return
        if (container.childCount < 3) return
        
        container.removeViewAt(2)
        
        when (layout) {
            LAYOUT_LETTERS -> lettersLayout?.let { container.addView(it) }
            LAYOUT_NUMBERS -> numbersLayout?.let { container.addView(it) }
            LAYOUT_SYMBOLS -> symbolsLayout?.let { container.addView(it) }
        }
        currentLayout = layout
    }
    
    private fun requestSuggestions(text: String) {
        typingRunnable?.let { handler.removeCallbacks(it) }
        
        typingRunnable = Runnable {
            val params = Arguments.createMap()
            params.putString("action", "suggestions")
            params.putString("text", text)
            sendEventToReactNative("onAIAction", params)
        }
        handler.postDelayed(typingRunnable!!, 300)
    }
    
    private fun setupLettersLayout() {
        val layout = lettersLayout ?: return
        
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
            layout.findViewById<Button>(id)?.setOnClickListener {
                vibrateKey()
                val text = if (isShiftActive || isCapsLock) letter.uppercase() else letter
                currentInputConnection?.commitText(text, 1)
                if (isShiftActive && !isCapsLock) {
                    isShiftActive = false
                    updateShiftKeyVisual()
                }
                
                val currentText = getCurrentTextFromModule()
                if (currentText.isNotEmpty()) {
                    requestSuggestions(currentText)
                }
            }
        }
        
        val shiftButton = layout.findViewById<Button>(R.id.key_shift)
        var lastShiftTime = 0L
        shiftButton?.setOnClickListener {
            vibrateKey()
            val now = System.currentTimeMillis()
            if (now - lastShiftTime < 300) {
                isCapsLock = !isCapsLock
                isShiftActive = isCapsLock
            } else {
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
        
        val backspaceButton = layout.findViewById<Button>(R.id.key_backspace)
        backspaceButton?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.deleteSurroundingText(1, 0)
        }
        backspaceButton?.setOnLongClickListener {
            vibrateKey()
            currentInputConnection?.deleteSurroundingText(20, 0)
            true
        }
        
        layout.findViewById<Button>(R.id.key_space)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.commitText(" ", 1)
            val currentText = getCurrentTextFromModule()
            if (currentText.isNotEmpty()) {
                requestSuggestions(currentText)
            }
        }
        
        layout.findViewById<Button>(R.id.key_enter)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.let { ic ->
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER))
            }
        }
        
        layout.findViewById<Button>(R.id.key_numbers)?.setOnClickListener {
            vibrateKey()
            switchToLayout(LAYOUT_NUMBERS)
        }
    }
    
    private fun setupNumbersLayout() {
        val layout = numbersLayout ?: return
        
        val numberKeys = mapOf(
            R.id.key_1 to "1", R.id.key_2 to "2", R.id.key_3 to "3",
            R.id.key_4 to "4", R.id.key_5 to "5", R.id.key_6 to "6",
            R.id.key_7 to "7", R.id.key_8 to "8", R.id.key_9 to "9",
            R.id.key_0 to "0"
        )
        
        numberKeys.forEach { (id, num) ->
            layout.findViewById<Button>(id)?.setOnClickListener {
                vibrateKey()
                currentInputConnection?.commitText(num, 1)
            }
        }
        
        val symbolKeys = mapOf(
            R.id.key_minus to "-", R.id.key_slash to "/", R.id.key_colon to ":",
            R.id.key_semicolon to ";", R.id.key_lparen to "(", R.id.key_rparen to ")",
            R.id.key_dollar to "$", R.id.key_amp to "&", R.id.key_at to "@",
            R.id.key_quote to "\"", R.id.key_dot to ".", R.id.key_comma to ",",
            R.id.key_question to "?", R.id.key_exclaim to "!", R.id.key_apostrophe to "'"
        )
        
        symbolKeys.forEach { (id, sym) ->
            layout.findViewById<Button>(id)?.setOnClickListener {
                vibrateKey()
                currentInputConnection?.commitText(sym, 1)
            }
        }
        
        layout.findViewById<Button>(R.id.key_abc)?.setOnClickListener {
            vibrateKey()
            switchToLayout(LAYOUT_LETTERS)
        }
        
        layout.findViewById<Button>(R.id.key_symbols)?.setOnClickListener {
            vibrateKey()
            switchToLayout(LAYOUT_SYMBOLS)
        }
        
        layout.findViewById<Button>(R.id.key_backspace)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.deleteSurroundingText(1, 0)
        }
        
        layout.findViewById<Button>(R.id.key_space)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.commitText(" ", 1)
        }
        
        layout.findViewById<Button>(R.id.key_enter)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.let { ic ->
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER))
            }
        }
    }
    
    private fun setupSymbolsLayout() {
        val layout = symbolsLayout ?: return
        
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
            layout.findViewById<Button>(id)?.setOnClickListener {
                vibrateKey()
                currentInputConnection?.commitText(sym, 1)
            }
        }
        
        layout.findViewById<Button>(R.id.key_abc)?.setOnClickListener {
            vibrateKey()
            switchToLayout(LAYOUT_LETTERS)
        }
        
        layout.findViewById<Button>(R.id.key_123)?.setOnClickListener {
            vibrateKey()
            switchToLayout(LAYOUT_NUMBERS)
        }
        
        layout.findViewById<Button>(R.id.key_backspace)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.deleteSurroundingText(1, 0)
        }
        
        layout.findViewById<Button>(R.id.key_space)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.commitText(" ", 1)
        }
        
        layout.findViewById<Button>(R.id.key_enter)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.let { ic ->
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
                ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER))
            }
        }
    }
    
    private fun updateShiftKeyVisual() {
        lettersLayout?.findViewById<Button>(R.id.key_shift)?.text = when {
            isCapsLock -> "⇪"
            isShiftActive -> "⬆"
            else -> "⇧"
        }
    }
    
    private fun vibrateKey() {
        try {
            vibrator?.vibrate(VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE))
        } catch (e: Exception) {
            // Ignore
        }
    }
    
    override fun onStartInput(attribute: EditorInfo?, restarting: Boolean) {
        super.onStartInput(attribute, restarting)
        
        val params = Arguments.createMap()
        params.putString("inputType", attribute?.inputType.toString())
        params.putString("packageName", attribute?.packageName)
        params.putString("fieldId", attribute?.fieldId.toString())
        sendEventToReactNative("onInputStart", params)
    }
    
    override fun onFinishInput() {
        super.onFinishInput()
        if (isViewInitialized) {
            hideSuggestions()
        }
        sendEventToReactNative("onInputFinish", null)
    }
    
    override fun onStartInputView(info: EditorInfo?, restarting: Boolean) {
        super.onStartInputView(info, restarting)
        
        if (currentLayout != LAYOUT_LETTERS) {
            switchToLayout(LAYOUT_LETTERS)
        }
        
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
        tonePopup?.dismiss()
        typingRunnable?.let { handler.removeCallbacks(it) }
        isViewInitialized = false
        instance = null
    }
}
