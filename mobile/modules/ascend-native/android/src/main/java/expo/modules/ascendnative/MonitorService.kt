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
import android.os.SystemClock
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
  // Timed with SystemClock.elapsedRealtime() (time since boot), not the wall clock,
  // so setting the phone's clock back can't stall the cooldown.
  private val lastLaunch = HashMap<String, Long>()

  // Last known state of the two permissions the watcher needs (worker thread only).
  private var permsOk = true
  // elapsedRealtime of the last check; starts "due" so the first tick checks at once,
  // even if the service starts within 30s of boot.
  private var lastPermCheck = -PERM_CHECK_MS
  // Last Focus state the notification was built for (worker thread only).
  private var lastFocusSig = ""

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
    if (!startInForeground()) {
      stopSelf()
      return START_NOT_STICKY
    }
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
    checkFocus()
    // If a permission was revoked, limits can't be enforced. Say so in the
    // notification (instead of claiming we're still guarding) and keep running,
    // so enforcement resumes by itself once it's turned back on.
    // Interval timing uses time-since-boot: a wall clock set back would otherwise
    // pause this check for as long as the jump.
    val nowMs = SystemClock.elapsedRealtime()
    if (nowMs - lastPermCheck >= PERM_CHECK_MS) {
      lastPermCheck = nowMs
      val ok = Permissions.hasUsageAccess(this) && Permissions.hasOverlay(this)
      if (ok != permsOk) {
        permsOk = ok
        refreshNotification()
      }
    }
    if (!permsOk) return

    val fg = UsageReader.currentForegroundApp(this) ?: return
    if (fg == packageName) return // our own friction screen is showing

    // A running Focus session wins over limits and grace: the app stays closed
    // until the timer ends (or the user pauses / stops it in Ascend).
    if (MonitorStore.isFocusBlocked(this, fg)) {
      if (cooledDown(fg)) launch("ascend://focus-block?app=$fg")
      return
    }

    val limit = MonitorStore.limitFor(this, fg) ?: return // not a monitored app

    // "Done for today" is a hard block → re-show the wall every time the app is
    // opened, until midnight. Otherwise wall only once over the limit and not
    // during an earned grace window.
    val shouldWall = if (MonitorStore.isBlockedToday(this, fg)) {
      true
    } else {
      UsageReader.todayMinutes(this, fg) >= limit && !MonitorStore.isInGrace(this, fg)
    }
    if (!shouldWall) return
    if (cooledDown(fg)) launch("ascend://friction?app=$fg")
  }

  /** Debounce: true (and stamps the time) if we haven't launched a screen for `pkg` just now. */
  private fun cooledDown(pkg: String): Boolean {
    val now = SystemClock.elapsedRealtime()
    val last = lastLaunch[pkg]
    if (last != null && now - last < LAUNCH_COOLDOWN_MS) return false
    lastLaunch[pkg] = now
    return true
  }

  /**
   * Keep the notification in step with Focus: a live countdown while a session
   * runs, back to normal when it pauses or stops, and a "summit reached" note
   * when the timer runs out (even if Ascend itself isn't open).
   */
  private fun checkFocus() {
    if (MonitorStore.isFocusFinished(this)) {
      val total = MonitorStore.focusTotalMinutes(this)
      MonitorStore.clearFocus(this)
      postFocusDone(total)
    }
    val sig = MonitorStore.focusSignature(this)
    if (sig != lastFocusSig) {
      lastFocusSig = sig
      refreshNotification()
    }
  }

  private fun postFocusDone(totalMinutes: Int) {
    try {
      val manager = getSystemService(NotificationManager::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
        manager.getNotificationChannel(FOCUS_CHANNEL_ID) == null
      ) {
        manager.createNotificationChannel(
          NotificationChannel(FOCUS_CHANNEL_ID, "Focus sessions", NotificationManager.IMPORTANCE_DEFAULT)
            .apply { description = "Lets you know when a focus session is done." },
        )
      }
      val text = if (totalMinutes > 0) {
        "Your $totalMinutes min climb is done, and your apps are open again."
      } else {
        "Your climb is done, and your apps are open again."
      }
      val notification = NotificationCompat.Builder(this, FOCUS_CHANNEL_ID)
        .setContentTitle("Summit reached")
        .setContentText(text)
        .setSmallIcon(R.drawable.ic_stat_ascend)
        .setAutoCancel(true)
        .setContentIntent(openAppIntent())
        .build()
      manager.notify(FOCUS_DONE_NOTIF_ID, notification)
    } catch (e: Exception) {
      // notifications blocked — Ascend shows the summit when it's next opened
    }
  }

  private fun openAppIntent(): PendingIntent = PendingIntent.getActivity(
    this,
    0,
    packageManager.getLaunchIntentForPackage(packageName),
    PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
  )

  private fun appLabel(pkg: String): String = try {
    packageManager.getApplicationLabel(packageManager.getApplicationInfo(pkg, 0)).toString()
  } catch (e: Exception) {
    pkg
  }

  private fun launch(uri: String) {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri))
      .setPackage(getPackageName())
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      startActivity(intent)
    } catch (e: Exception) {
      // SYSTEM_ALERT_WINDOW permits this background-activity launch; if it ever
      // fails we simply try again next tick.
    }
  }

  /**
   * Promote to a foreground service. Android 12+ can refuse this (e.g. on a
   * sticky restart while the app is in the background) — return false instead
   * of crashing; the next time Ascend is opened, startWatching retries.
   */
  private fun startInForeground(): Boolean = try {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
    } else {
      startForeground(NOTIF_ID, notification)
    }
    true
  } catch (e: Exception) {
    false
  }

  /** Re-post the ongoing notification so its text matches the permission state. */
  private fun refreshNotification() {
    try {
      getSystemService(NotificationManager::class.java).notify(NOTIF_ID, buildNotification())
    } catch (e: Exception) {
      // notifications blocked — nothing to update
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

    val focusing = permsOk && MonitorStore.isFocusActive(this)
    val (title, text) = when {
      !permsOk ->
        "Ascend needs a quick fix" to "A permission was turned off, so your limits are paused. Tap to turn it back on."
      focusing -> {
        val names = MonitorStore.focusApps(this).map { appLabel(it) }
        val waiting = when (names.size) {
          0 -> "Your apps are"
          1 -> "${names[0]} is"
          2 -> "${names[0]} and ${names[1]} are"
          else -> "${names[0]}, ${names[1]} and ${names.size - 2} more are"
        }
        "You're in focus" to "$waiting waiting at base camp."
      }
      else -> "Ascend is guarding your limits" to "Watching your monitored apps."
    }
    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(text)
      .setStyle(NotificationCompat.BigTextStyle().bigText(text))
      .setSmallIcon(R.drawable.ic_stat_ascend)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setContentIntent(openAppIntent())
    if (focusing) {
      // The system ticks this countdown itself — no need to re-post every second.
      builder
        .setWhen(System.currentTimeMillis() + MonitorStore.focusRemainingMs(this))
        .setShowWhen(true)
        .setUsesChronometer(true)
        .setChronometerCountDown(true)
    }
    return builder.build()
  }

  companion object {
    private const val NOTIF_ID = 4201
    private const val FOCUS_DONE_NOTIF_ID = 4202
    private const val CHANNEL_ID = "ascend_monitor"
    private const val FOCUS_CHANNEL_ID = "ascend_focus"
    private const val POLL_MS = 2_000L // screen-on poll (screen-off idles at IDLE_MS)
    private const val IDLE_MS = 60_000L // screen-off idle between safety re-checks
    private const val LAUNCH_COOLDOWN_MS = 1_500L // < POLL_MS so it never adds delay on re-block
    private const val PERM_CHECK_MS = 30_000L // how often to re-check the two permissions
  }
}
