package expo.modules.ascendnative

import android.content.Context
import org.json.JSONObject

/**
 * The shared brain-state between JS and the background service, persisted in
 * SharedPreferences so the service stays correct even when the JS app isn't
 * running (e.g. after a reboot, or while it's swiped away).
 *
 * Why timestamps/dates instead of booleans for grace/blocked: they SELF-EXPIRE.
 * grace[pkg] is the epoch ms the grace ends; blocked[pkg] is the day string it
 * applies to. The service can decide "in grace?" / "blocked today?" purely from
 * the clock, with no JS round-trip — and blocked naturally lapses at midnight.
 */
object MonitorStore {
  private const val PREFS = "ascend_monitor"
  private const val KEY_ENABLED = "enabled"
  private const val KEY_CONFIG = "config"   // JSON { pkg: limitMinutes }
  private const val KEY_GRACE = "grace"     // JSON { pkg: epochMs }
  private const val KEY_BLOCKED = "blocked" // JSON { pkg: "YYYY-MM-DD" }

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  // --- enabled -----------------------------------------------------------

  fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)

  fun setEnabled(context: Context, value: Boolean) {
    prefs(context).edit().putBoolean(KEY_ENABLED, value).apply()
  }

  // --- config (pkg → limit minutes) --------------------------------------

  fun setConfig(context: Context, config: Map<String, Int>) {
    val json = JSONObject()
    config.forEach { (pkg, limit) -> json.put(pkg, limit) }
    prefs(context).edit().putString(KEY_CONFIG, json.toString()).apply()
  }

  /** The monitored limit (minutes) for a package, or null if not monitored. */
  fun limitFor(context: Context, packageName: String): Int? {
    val json = readJson(context, KEY_CONFIG)
    return if (json.has(packageName)) json.getInt(packageName) else null
  }

  // --- grace (pkg → epoch ms it ends) ------------------------------------

  /**
   * `untilMs` is wall-clock epoch ms from JS. Store it on the trusted clock
   * (same remaining time, measured from trusted "now"), so winding the phone's
   * clock back can't stretch the grace window.
   */
  fun setGrace(context: Context, packageName: String, untilMs: Long) {
    val remaining = untilMs - System.currentTimeMillis()
    val json = readJson(context, KEY_GRACE)
    json.put(packageName, TrustedClock.now(context) + remaining)
    prefs(context).edit().putString(KEY_GRACE, json.toString()).apply()
  }

  fun isInGrace(context: Context, packageName: String): Boolean {
    val until = readJson(context, KEY_GRACE).optLong(packageName, 0L)
    return until > TrustedClock.now(context)
  }

  // --- blocked (pkg → day string) ----------------------------------------

  // "Today" comes from the trusted clock, so changing the date doesn't lift a block.
  fun setBlockedToday(context: Context, packageName: String) {
    val json = readJson(context, KEY_BLOCKED)
    json.put(packageName, TrustedClock.today(context))
    prefs(context).edit().putString(KEY_BLOCKED, json.toString()).apply()
  }

  fun isBlockedToday(context: Context, packageName: String): Boolean =
    readJson(context, KEY_BLOCKED).optString(packageName, "") == TrustedClock.today(context)

  // --- clearing (midnight reset / dev reset / answered) ------------------

  fun clearFriction(context: Context, packageName: String) {
    val grace = readJson(context, KEY_GRACE).apply { remove(packageName) }
    val blocked = readJson(context, KEY_BLOCKED).apply { remove(packageName) }
    prefs(context).edit()
      .putString(KEY_GRACE, grace.toString())
      .putString(KEY_BLOCKED, blocked.toString())
      .apply()
  }

  fun clearAllFriction(context: Context) {
    prefs(context).edit().remove(KEY_GRACE).remove(KEY_BLOCKED).apply()
  }

  // --- helpers -----------------------------------------------------------

  private fun readJson(context: Context, key: String): JSONObject =
    try {
      JSONObject(prefs(context).getString(key, "{}") ?: "{}")
    } catch (e: Exception) {
      JSONObject()
    }
}
