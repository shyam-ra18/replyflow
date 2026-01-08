package com.replyflow

import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.ImageView
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import android.app.NotificationChannel
import android.app.NotificationManager

class FloatingButtonService : Service() {
    private var windowManager: WindowManager? = null
    private var floatingView: View? = null
    private var params: WindowManager.LayoutParams? = null
    
    companion object {
        const val CHANNEL_ID = "replyflow_service_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_SHOW = "com.replyflow.SHOW_BUTTON"
        const val ACTION_HIDE = "com.replyflow.HIDE_BUTTON"
        var isServiceRunning = false
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        isServiceRunning = true
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "ReplyFlow Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Writing assistant is active"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun showFloatingButton() {
        if (floatingView != null) return // Already showing

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        
        // Inflate the floating view layout
        floatingView = LayoutInflater.from(this).inflate(R.layout.floating_button_layout, null)
        
        // Set up window parameters
        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }
        
        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 100
        }
        
        try {
            windowManager?.addView(floatingView, params)
            setupTouchListener()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun hideFloatingButton() {
        if (floatingView != null) {
            try {
                windowManager?.removeView(floatingView)
                floatingView = null
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun setupTouchListener() {
        val floatingButton = floatingView?.findViewById<ImageView>(R.id.floating_button)
        
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var isDragging = false
        
        floatingButton?.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params?.x ?: 0
                    initialY = params?.y ?: 0
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    isDragging = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val deltaX = event.rawX - initialTouchX
                    val deltaY = event.rawY - initialTouchY
                    
                    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                        isDragging = true
                        params?.x = initialX + deltaX.toInt()
                        params?.y = initialY + deltaY.toInt()
                        try {
                            windowManager?.updateViewLayout(floatingView, params)
                        } catch (e: Exception) {}
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!isDragging) {
                        sendClickEventToReactNative()
                    }
                    true
                }
                else -> false
            }
        }
    }

    private fun sendClickEventToReactNative() {
        // Send broadcast first
        val broadcastIntent = Intent("com.replyflow.FLOATING_BUTTON_CLICKED")
        sendBroadcast(broadcastIntent)

        // Also try to bring app to foreground/start it
        try {
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            launchIntent?.apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                startActivity(this)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ReplyFlow Active")
            .setContentText("Writing assistant is ready")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
        
        startForeground(NOTIFICATION_ID, notification)

        when (intent?.action) {
            ACTION_SHOW -> showFloatingButton()
            ACTION_HIDE -> hideFloatingButton()
            else -> showFloatingButton() // Default behavior
        }
        
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        hideFloatingButton()
        isServiceRunning = false
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
