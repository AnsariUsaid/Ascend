package expo.modules.ascendnative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * The "muscle": a foreground service that polls every few seconds and, when the
 * user is in a monitored app that's over its limit (and not in grace / not
 * blocked), relaunches our own app at ascend://friction?app=<pkg> on top of it.
 *
 * The friction "brain" stays in JS — this service only WATCHES and TRIGGERS,
 * reading the shared state from MonitorStore (SharedPreferences). START_STICKY +
 * BootReceiver keep it alive across kills and reboots.
 */
class MonitorService : Service() {
  @Volatile private var running = false
  private var worker: Thread? = null
  // pkg → last time we launched friction for it (debounce while the friction
  // activity is coming to the foreground).
  private val lastLaunch = HashMap<String, Long>()

  // Whether the screen is on. When it's off, nobody can be using an app, so the
  // poll loop idles to save battery; SCREEN_ON wakes it immediately.
  @Volatile private var screenOn = true
  private val screenReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      when (intent.action) {
        Intent.ACTION_SCREEN_OFF -> screenOn = false
        Intent.ACTION_SCREEN_ON -> {
          screenOn = true
          worker?.interrupt() // wake the idling loop to poll right away
        }
      }
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startInForeground()
    if (!running) {
      running = true
      screenOn = (getSystemService(Context.POWER_SERVICE) as PowerManager).isInteractive
      val filter = IntentFilter().apply {
        addAction(Intent.ACTION_SCREEN_ON)
        addAction(Intent.ACTION_SCREEN_OFF)
      }
      ContextCompat.registerReceiver(this, screenReceiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
      worker = Thread { loop() }.also { it.start() }
    }
    return START_STICKY
  }

  override fun onDestroy() {
    running = false
    worker?.interrupt()
    try {
      unregisterReceiver(screenReceiver)
    } catch (e: Exception) {
      // wasn't registered (service never fully started) — ignore
    }
    super.onDestroy()
  }

  private fun loop() {
    while (running) {
      try {
        if (!screenOn) {
          // Screen off → nobody can be using an app. Idle cheaply instead of
          // waking every few seconds; SCREEN_ON interrupts this to resume at once.
          Thread.sleep(IDLE_MS)
          continue
        }
        tick()
        Thread.sleep(POLL_MS)
      } catch (e: InterruptedException) {
        if (!running) break // stopping; otherwise woken by SCREEN_ON → re-loop
      } catch (e: Exception) {
        // Never let a single bad read kill the watcher.
        try {
          Thread.sleep(POLL_MS)
        } catch (ie: InterruptedException) {
          if (!running) break
        }
      }
    }
  }

  private fun tick() {
    if (!MonitorStore.isEnabled(this)) {
      running = false
      stopSelf()
      return
    }
    val fg = UsageReader.currentForegroundApp(this) ?: return
    if (fg == packageName) return // our own friction screen is showing
    val limit = MonitorStore.limitFor(this, fg) ?: return // not a monitored app
    if (UsageReader.todayMinutes(this, fg) < limit) return // still under the limit
    if (MonitorStore.isInGrace(this, fg)) return // earned time still ticking
    if (MonitorStore.isBlockedToday(this, fg)) return // "done for today" already handled

    val now = System.currentTimeMillis()
    if (now - (lastLaunch[fg] ?: 0L) < LAUNCH_COOLDOWN_MS) return
    lastLaunch[fg] = now
    launchFriction(fg)
  }

  private fun launchFriction(packageName: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("ascend://friction?app=$packageName"))
      .setPackage(getPackageName())
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      startActivity(intent)
    } catch (e: Exception) {
      // SYSTEM_ALERT_WINDOW permits this background-activity launch; if it ever
      // fails we simply try again next tick.
    }
  }

  private fun startInForeground() {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIF_ID, notification)
    }
  }

  private fun buildNotification(): Notification {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val manager = getSystemService(NotificationManager::class.java)
      if (manager.getNotificationChannel(CHANNEL_ID) == null) {
        val channel = NotificationChannel(
          CHANNEL_ID,
          "Limit guard",
          NotificationManager.IMPORTANCE_LOW,
        ).apply { description = "Keeps Ascend watching your app limits in the background." }
        manager.createNotificationChannel(channel)
      }
    }

    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val contentIntent = PendingIntent.getActivity(
      this,
      0,
      launch,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Ascend is guarding your limits")
      .setContentText("Watching your monitored apps.")
      .setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setContentIntent(contentIntent)
      .build()
  }

  companion object {
    private const val NOTIF_ID = 4201
    private const val CHANNEL_ID = "ascend_monitor"
    private const val POLL_MS = 3_000L
    private const val IDLE_MS = 60_000L // screen-off idle between safety re-checks
    private const val LAUNCH_COOLDOWN_MS = 5_000L
  }
}
