package com.replyflow.keyboard

import android.inputmethodservice.InputMethodService
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.MotionEvent
import android.widget.Button
import android.widget.TextView
import android.widget.LinearLayout
import android.widget.FrameLayout
import android.widget.PopupWindow
import android.widget.ProgressBar
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
    
    private var keyboardContainer: FrameLayout? = null
    private var mainContainer: LinearLayout? = null
    private var quickSuggestions: View? = null
    private var aiToolbar: View? = null
    private var lettersLayout: View? = null
    private var numbersLayout: View? = null
    private var symbolsLayout: View? = null
    private var loadingOverlay: View? = null
    private var currentLayout = 0
    private var isShiftActive = false
    private var isCapsLock = false
    private var vibrator: Vibrator? = null
    private var tonePopup: PopupWindow? = null
    private val handler = Handler(Looper.getMainLooper())
    private var isViewInitialized = false
    
    // Backspace continuous deletion
    private var isBackspacePressed = false
    private var backspaceDeleteRunnable: Runnable? = null
    private var deleteSpeed = 100L // Start slow
    private var deleteStartTime = 0L
    
    // Loading messages
    private val toneLoadingMessages = listOf(
        "✨ Adjusting your tone...",
        "🎯 Refining your message...",
        "🎨 Applying polish...",
        "📝 Rewriting with care..."
    )
    private val expandLoadingMessages = listOf(
        "📝 Expanding your message...",
        "✍️ Writing it out for you...",
        "🌟 Crafting complete sentences...",
        "💬 Making it comprehensive..."
    )
    private val summarizeLoadingMessages = listOf(
        "🔍 Condensing your message...",
        "📊 Creating a summary...",
        "⚡ Making it concise...",
        "🎯 Extracting key points..."
    )
    private val replyLoadingMessages = listOf(
        "💭 Generating reply options...",
        "🤖 Thinking of responses...",
        "💡 Crafting smart replies...",
        "✉️ Finding the right words..."
    )
    
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
        
        // Create root FrameLayout (for overlay support)
        val rootContainer = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        keyboardContainer = rootContainer
        
        // Create main keyboard container
        val main = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )
        }
        mainContainer = main
        
        // Inflate quick suggestions bar (pre-defined messages)
        quickSuggestions = inflater.inflate(R.layout.quick_suggestions, main, false)
        setupQuickSuggestions()
        
        // Inflate AI toolbar
        aiToolbar = inflater.inflate(R.layout.ai_toolbar, main, false)
        setupAIToolbar()
        
        // Inflate keyboard layouts
        lettersLayout = inflater.inflate(R.layout.keyboard_letters, main, false)
        numbersLayout = inflater.inflate(R.layout.keyboard_numbers, main, false)
        symbolsLayout = inflater.inflate(R.layout.keyboard_symbols, main, false)
        
        // Setup all layouts with improved backspace
        setupLettersLayout()
        setupNumbersLayout()
        setupSymbolsLayout()
        
        // Inflate loading overlay
        loadingOverlay = inflater.inflate(R.layout.loading_overlay, rootContainer, false)
        setupLoadingOverlay()
        
        // Add views to main container
        main.addView(quickSuggestions)
        main.addView(aiToolbar)
        main.addView(lettersLayout)
        currentLayout = LAYOUT_LETTERS
        
        // Add main container and loading overlay to root
        rootContainer.addView(main)
        rootContainer.addView(loadingOverlay)
        
        // Enable hardware acceleration
        rootContainer.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        
        isViewInitialized = true
        return rootContainer
    }
    
    private fun setupQuickSuggestions() {
        val suggestions = quickSuggestions ?: return
        
        val quickIds = listOf(
            R.id.quick_1, R.id.quick_2, R.id.quick_3,
            R.id.quick_4, R.id.quick_5, R.id.quick_6
        )
        
        quickIds.forEach { id ->
            suggestions.findViewById<TextView>(id)?.setOnClickListener {
                vibrateKey()
                val text = (it as TextView).text.toString()
                currentInputConnection?.commitText(text, 1)
            }
        }
    }
    
    private fun setupLoadingOverlay() {
        // Now using inline loading in AI toolbar
        val toolbar = aiToolbar ?: return
        
        toolbar.findViewById<Button>(R.id.btn_cancel_loading)?.setOnClickListener {
            hideLoading()
            val params = Arguments.createMap()
            params.putString("action", "cancel")
            sendEventToReactNative("onAIAction", params)
        }
    }
    
    private fun showLoading(messages: List<String>) {
        val toolbar = aiToolbar ?: return
        
        handler.post {
            val randomMessage = messages.random()
            toolbar.findViewById<TextView>(R.id.loading_text)?.text = randomMessage
            toolbar.findViewById<View>(R.id.ai_buttons_container)?.visibility = View.GONE
            toolbar.findViewById<View>(R.id.loading_container)?.visibility = View.VISIBLE
        }
        
        // Auto-hide after 30 seconds (timeout)
        handler.postDelayed({
            val loadingContainer = toolbar.findViewById<View>(R.id.loading_container)
            if (loadingContainer?.visibility == View.VISIBLE) {
                showLoadingError()
            }
        }, 30000)
    }
    
    fun hideLoading() {
        val toolbar = aiToolbar ?: return
        handler.post {
            toolbar.findViewById<View>(R.id.loading_container)?.visibility = View.GONE
            toolbar.findViewById<View>(R.id.ai_buttons_container)?.visibility = View.VISIBLE
        }
    }
    
    private fun showLoadingError() {
        val toolbar = aiToolbar ?: return
        toolbar.findViewById<TextView>(R.id.loading_text)?.text = "⚠️ Timeout. Try again."
        handler.postDelayed({
            hideLoading()
        }, 2000)
    }
    
    private fun setupAIToolbar() {
        val toolbar = aiToolbar ?: return
        
        toolbar.findViewById<Button>(R.id.btn_tone)?.setOnClickListener {
            vibrateKey()
            showTonePicker()
        }
        
        toolbar.findViewById<Button>(R.id.btn_expand)?.setOnClickListener {
            vibrateKey()
            showLoading(expandLoadingMessages)
            triggerAIAction("expand")
        }
        
        toolbar.findViewById<Button>(R.id.btn_summarize)?.setOnClickListener {
            vibrateKey()
            showLoading(summarizeLoadingMessages)
            triggerAIAction("summarize")
        }
        
        toolbar.findViewById<Button>(R.id.btn_replies)?.setOnClickListener {
            vibrateKey()
            showLoading(replyLoadingMessages)
            triggerAIAction("replies")
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
        
        val toneButtons = mapOf(
            R.id.tone_professional to "professional",
            R.id.tone_casual to "casual",
            R.id.tone_confident to "confident",
            R.id.tone_empathetic to "empathetic",
            R.id.tone_concise to "concise"
        )
        
        toneButtons.forEach { (id, tone) ->
            toneView.findViewById<Button>(id)?.setOnClickListener {
                tonePopup?.dismiss()
                showLoading(toneLoadingMessages)
                applyTone(tone)
            }
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
        } else {
            hideLoading()
        }
    }
    
    private fun triggerAIAction(action: String) {
        val currentText = getCurrentTextFromModule()
        if (currentText.isEmpty() && action != "replies") {
            hideLoading()
            return
        }
        val params = Arguments.createMap()
        params.putString("action", action)
        params.putString("text", currentText)
        sendEventToReactNative("onAIAction", params)
    }
    
    fun updateSuggestions(suggestions: List<String>) {
        // Show suggestions as smart replies
        hideLoading()
        // For now, just insert the first suggestion if available
        if (suggestions.isNotEmpty()) {
            // We could show a popup with options, but for simplicity:
            // Just show them in a toast-like way or insert first one
        }
    }
    
    fun replaceWithAIResponse(newText: String) {
        hideLoading()
        currentInputConnection?.let { ic ->
            ic.performContextMenuAction(android.R.id.selectAll)
            ic.commitText(newText, 1)
        }
    }
    
    private fun switchToLayout(layout: Int) {
        val container = mainContainer ?: return
        if (container.childCount < 3) return
        
        container.removeViewAt(2)
        
        when (layout) {
            LAYOUT_LETTERS -> lettersLayout?.let { container.addView(it) }
            LAYOUT_NUMBERS -> numbersLayout?.let { container.addView(it) }
            LAYOUT_SYMBOLS -> symbolsLayout?.let { container.addView(it) }
        }
        currentLayout = layout
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
                // REMOVED: No more real-time suggestion requests
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
        
        // Improved backspace with selection delete + continuous deletion
        setupBackspaceButton(layout.findViewById(R.id.key_backspace))
        
        layout.findViewById<Button>(R.id.key_space)?.setOnClickListener {
            vibrateKey()
            currentInputConnection?.commitText(" ", 1)
            // REMOVED: No more real-time suggestion requests
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
    
    private fun setupBackspaceButton(button: Button?) {
        button ?: return
        
        button.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    vibrateKey()
                    isBackspacePressed = true
                    deleteStartTime = System.currentTimeMillis()
                    deleteSpeed = 100L
                    
                    // First delete - check for selection
                    deleteOneUnit()
                    
                    // Start continuous deletion
                    startContinuousDelete()
                    true
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    isBackspacePressed = false
                    stopContinuousDelete()
                    true
                }
                else -> false
            }
        }
    }
    
    private fun deleteOneUnit() {
        val ic = currentInputConnection ?: return
        
        // Check if there's selected text
        val selectedText = ic.getSelectedText(0)
        if (selectedText != null && selectedText.isNotEmpty()) {
            // Delete entire selection
            ic.commitText("", 1)
        } else {
            // Check how long backspace has been held
            val elapsedTime = System.currentTimeMillis() - deleteStartTime
            
            when {
                elapsedTime < 500 -> {
                    // First 500ms: Delete character by character
                    ic.deleteSurroundingText(1, 0)
                    deleteSpeed = 100L
                }
                elapsedTime < 2000 -> {
                    // 500ms - 2s: Delete word by word
                    deleteWord(ic)
                    deleteSpeed = 150L
                }
                else -> {
                    // After 2s: Delete rapidly (multiple chars)
                    ic.deleteSurroundingText(5, 0)
                    deleteSpeed = 50L
                }
            }
        }
    }
    
    private fun deleteWord(ic: android.view.inputmethod.InputConnection) {
        // Get text before cursor
        val textBefore = ic.getTextBeforeCursor(50, 0) ?: return
        if (textBefore.isEmpty()) return
        
        // Find word boundary
        var deleteCount = 0
        var foundWord = false
        for (i in textBefore.length - 1 downTo 0) {
            val char = textBefore[i]
            if (char.isWhitespace()) {
                if (foundWord) break
            } else {
                foundWord = true
            }
            deleteCount++
        }
        
        if (deleteCount > 0) {
            ic.deleteSurroundingText(deleteCount, 0)
        } else {
            ic.deleteSurroundingText(1, 0)
        }
    }
    
    private fun startContinuousDelete() {
        backspaceDeleteRunnable = object : Runnable {
            override fun run() {
                if (isBackspacePressed) {
                    vibrateKey()
                    deleteOneUnit()
                    handler.postDelayed(this, deleteSpeed)
                }
            }
        }
        handler.postDelayed(backspaceDeleteRunnable!!, 400) // Initial delay before repeat
    }
    
    private fun stopContinuousDelete() {
        backspaceDeleteRunnable?.let { handler.removeCallbacks(it) }
        backspaceDeleteRunnable = null
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
        
        setupBackspaceButton(layout.findViewById(R.id.key_backspace))
        
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
        
        setupBackspaceButton(layout.findViewById(R.id.key_backspace))
        
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
            hideLoading()
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
        stopContinuousDelete()
        isViewInitialized = false
        instance = null
    }
}
