package expo.modules.ascendnative

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import java.util.Calendar

/**
 * The "eyes": all reads from UsageStatsManager live here so both the JS-facing
 * module (AscendNativeModule.getUsage) and the background MonitorService share
 * one event-based implementation.
 *
 * Usage is computed from raw EVENTS (each app's resumed→paused intervals), which
 * matches Digital Wellbeing far better than the aggregate totalTimeInForeground
 * (that overcounts ~2×). If Usage Access isn't granted, queryEvents is empty → zeros.
 *
 * This is an `object` (singleton) because currentForegroundApp keeps a little
 * cross-call state so it stays correct even when the user sits in one app for a
 * long time with no fresh RESUMED events.
 */
object UsageReader {
  private const val DAY_MS = 24L * 60L * 60L * 1000L

  /**
   * Foreground minutes per package for the last `days` calendar days.
   * Returns { pkg: [oldest, ..., today] } (each list length == days).
   */
  fun getUsage(context: Context, packageNames: List<String>, days: Int): Map<String, List<Int>> {
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val pkgSet = packageNames.toHashSet()
    val totalsMs = packageNames.associateWith { LongArray(days) } // ms per day per pkg

    val startOfToday = startOfTodayMs()
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

  /** Today's foreground minutes for a single package. */
  fun todayMinutes(context: Context, packageName: String): Int =
    getUsage(context, listOf(packageName), 1)[packageName]?.lastOrNull() ?: 0

  // --- current foreground app (stateful) ---------------------------------

  private var lastQueryTs = 0L
  private var currentFg: String? = null

  /**
   * The package currently in the foreground, or null (home/screen-off/unknown).
   *
   * We can't just look at "the last RESUMED in the past 10s" — if the user has
   * been sitting in one app for minutes there are no recent events. Instead we
   * accumulate across calls: each tick reads only the events since the previous
   * query and updates a remembered current app. A RESUMED sets it; the screen
   * turning off (or shutdown) clears it.
   */
  @Synchronized
  fun currentForegroundApp(context: Context): String? {
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val now = System.currentTimeMillis()
    val from = if (lastQueryTs == 0L) now - 10_000L else lastQueryTs
    val events = usm.queryEvents(from, now)
    val event = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      when (event.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> currentFg = event.packageName
        UsageEvents.Event.SCREEN_NON_INTERACTIVE -> currentFg = null
        UsageEvents.Event.DEVICE_SHUTDOWN -> currentFg = null
      }
    }
    lastQueryTs = now
    return currentFg
  }

  private fun startOfTodayMs(): Long =
    Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }.timeInMillis
}
