package expo.modules.ascendnative

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import java.util.Calendar
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Native bridge for Ascend. Phase B exposes the two "special" permissions that
 * cannot be granted by a normal popup — the user must toggle them in system
 * Settings, so we expose checkers + openers that JavaScript can call.
 */
class AscendNativeModule : Module() {
  // `definition()` is the Expo Modules API DSL: it declares the JS-callable
  // surface of this module. The string in Name(...) is how JS finds it.
  override fun definition() = ModuleDefinition {
    Name("AscendNative")

    // Each Function(...) becomes a method JS can call: AscendNative.hasUsageAccess(), etc.
    Function("hasUsageAccess") { hasUsageAccess() }
    Function("openUsageAccessSettings") { openUsageAccessSettings() }
    Function("hasOverlayPermission") { hasOverlayPermission() }
    Function("openOverlaySettings") { openOverlaySettings() }

    // Per-app foreground minutes for the last `days` days.
    // Returns { packageName: [oldest, ..., today] } (each list length == days).
    Function("getUsage") { packageNames: List<String>, days: Int ->
      getUsage(packageNames, days)
    }

    // Installed, launchable apps on the device: [{ packageName, name }, ...].
    Function("getInstalledApps") { getInstalledApps() }
  }

  // App context provided by Expo. Used to read system services and start intents.
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "Android context unavailable" }

  /**
   * Usage Access (PACKAGE_USAGE_STATS) isn't a runtime permission — it's an
   * "app op" the user grants in a special settings screen. We check it via
   * AppOpsManager.
   */
  private fun hasUsageAccess(): Boolean {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName,
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName,
      )
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  private fun openUsageAccessSettings() {
    // FLAG_ACTIVITY_NEW_TASK is required because we're launching from a
    // non-Activity context (the app/React context).
    val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  /** Overlay (SYSTEM_ALERT_WINDOW) has a dedicated framework check. */
  private fun hasOverlayPermission(): Boolean = Settings.canDrawOverlays(context)

  private fun openOverlaySettings() {
    val intent = Intent(
      Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
      Uri.parse("package:${context.packageName}"),
    ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  /**
   * Foreground time (minutes) per package for the last `days` calendar days,
   * computed from raw usage EVENTS (each app's resumed→paused intervals). This
   * matches Digital Wellbeing far better than the aggregate totalTimeInForeground,
   * which overcounts. If Usage Access isn't granted, queryEvents is empty → zeros.
   */
  private fun getUsage(packageNames: List<String>, days: Int): Map<String, List<Int>> {
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val pkgSet = packageNames.toHashSet()
    val totalsMs = packageNames.associateWith { LongArray(days) } // ms per day per pkg

    val cal = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }
    val startOfToday = cal.timeInMillis
    val now = System.currentTimeMillis()
    val rangeStart = startOfToday - (days - 1) * DAY_MS

    // Add a foreground interval, splitting it across day buckets if it crosses midnight.
    fun addInterval(pkg: String, start: Long, end: Long) {
      var s = start.coerceAtLeast(rangeStart)
      while (s < end) {
        val dayIndex = (((s - rangeStart) / DAY_MS).toInt()).coerceIn(0, days - 1)
        val nextBoundary = rangeStart + (dayIndex + 1) * DAY_MS
        val segEnd = minOf(end, nextBoundary)
        totalsMs[pkg]!![dayIndex] += (segEnd - s)
        s = segEnd
      }
    }

    val events = usm.queryEvents(rangeStart, now)
    val event = UsageEvents.Event()
    val resumedAt = HashMap<String, Long>() // pkg → timestamp it last came to foreground

    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val pkg = event.packageName ?: continue
      if (pkg !in pkgSet) continue
      when (event.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> resumedAt[pkg] = event.timeStamp
        UsageEvents.Event.ACTIVITY_PAUSED -> {
          val start = resumedAt.remove(pkg)
          if (start != null && event.timeStamp > start) addInterval(pkg, start, event.timeStamp)
        }
      }
    }
    // Apps still in the foreground right now (no matching pause yet).
    resumedAt.forEach { (pkg, start) -> if (now > start) addInterval(pkg, start, now) }

    return totalsMs.mapValues { (_, arr) -> arr.map { (it / 60_000L).toInt() } }
  }

  /** Launchable apps installed on the device (excludes Ascend itself). */
  private fun getInstalledApps(): List<Map<String, String>> {
    val pm = context.packageManager
    val intent = Intent(Intent.ACTION_MAIN, null).addCategory(Intent.CATEGORY_LAUNCHER)
    val seen = HashSet<String>()
    return pm.queryIntentActivities(intent, 0)
      .mapNotNull { ri ->
        val pkg = ri.activityInfo.packageName
        if (pkg == context.packageName || !seen.add(pkg)) return@mapNotNull null
        mapOf("packageName" to pkg, "name" to ri.loadLabel(pm).toString())
      }
      .sortedBy { it["name"]?.lowercase() }
  }

  companion object {
    private const val DAY_MS = 24L * 60L * 60L * 1000L
  }
}
