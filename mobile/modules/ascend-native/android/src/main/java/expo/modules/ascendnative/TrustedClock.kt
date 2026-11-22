package expo.modules.ascendnative

import android.content.Context
import android.os.SystemClock
import android.provider.Settings
import java.text.SimpleDateFormat
import java.util.Locale
import kotlin.math.abs

/**
 * A clock the user can't wind. The phone's wall clock can be changed in
 * Settings, which used to reset "done for today" and stretch grace. This keeps
 * an anchor — "the wall clock read W when time-since-boot read E" — and from
 * then on trusts W + (time-since-boot elapsed), which Settings can't change.
 *
 * - Small disagreements (≤ DRIFT_MS, e.g. network time nudges) re-anchor to the
 *   wall clock, so normal clock corrections are followed.
 * - Bigger jumps are ignored until the next reboot (time-since-boot resets on
 *   boot, so we re-anchor to the wall clock then).
 * - Time-zone changes still apply: the day string is formatted in the current
 *   zone, so travellers' days follow local midnight.
 */
object TrustedClock {
  private const val PREFS = "ascend_clock"
  private const val KEY_WALL = "anchor_wall"
  private const val KEY_ELAPSED = "anchor_elapsed"
  private const val KEY_BOOT = "anchor_boot"
  private const val DRIFT_MS = 2L * 60L * 1000L
  private const val REANCHOR_MS = 60L * 60L * 1000L // refresh a healthy anchor hourly

  /** Trusted epoch ms. */
  @Synchronized
  fun now(context: Context): Long {
    val wall = System.currentTimeMillis()
    val elapsed = SystemClock.elapsedRealtime()
    val boot = bootCount(context)
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val anchorWall = prefs.getLong(KEY_WALL, -1L)
    val anchorElapsed = prefs.getLong(KEY_ELAPSED, -1L)
    val anchorBoot = prefs.getInt(KEY_BOOT, Int.MIN_VALUE)

    // No anchor yet, or the phone rebooted (time-since-boot restarted): start from the wall clock.
    if (anchorWall < 0 || anchorBoot != boot || elapsed < anchorElapsed) {
      saveAnchor(context, wall, elapsed, boot)
      return wall
    }

    val trusted = anchorWall + (elapsed - anchorElapsed)
    if (abs(wall - trusted) <= DRIFT_MS) {
      // Clock agrees with us — follow it, re-anchoring now and then to absorb drift.
      if (elapsed - anchorElapsed >= REANCHOR_MS) saveAnchor(context, wall, elapsed, boot)
      return wall
    }
    // The wall clock jumped (changed in Settings) — ignore it.
    return trusted
  }

  /** Trusted local "YYYY-MM-DD" — matches the JS todayKey() format. */
  fun today(context: Context): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now(context))

  private fun saveAnchor(context: Context, wall: Long, elapsed: Long, boot: Int) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
      .putLong(KEY_WALL, wall)
      .putLong(KEY_ELAPSED, elapsed)
      .putInt(KEY_BOOT, boot)
      .apply()
  }

  /** Android's boot counter (-1 if unavailable) — changes on every reboot. */
  fun bootCount(context: Context): Int =
    try {
      Settings.Global.getInt(context.contentResolver, Settings.Global.BOOT_COUNT)
    } catch (e: Exception) {
      -1 // unavailable — the elapsed < anchorElapsed check still catches reboots
    }
}
