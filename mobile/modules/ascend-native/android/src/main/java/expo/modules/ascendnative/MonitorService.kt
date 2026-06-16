package expo.modules.ascendnative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.Uri
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

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

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startInForeground()
    if (!running) {
      running = true
      worker = Thread { loop() }.also { it.start() }
    }
    return START_STICKY
  }

  override fun onDestroy() {
    running = false
    worker?.interrupt()
    super.onDestroy()
  }

  private fun loop() {
    while (running) {
      try {
        tick()
        Thread.sleep(POLL_MS)
      } catch (e: InterruptedException) {
        break
      } catch (e: Exception) {
        // Never let a single bad read kill the watcher.
        try {
          Thread.sleep(POLL_MS)
        } catch (ie: InterruptedException) {
          break
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
    private const val LAUNCH_COOLDOWN_MS = 5_000L
  }
}
