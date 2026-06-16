package expo.modules.ascendnative

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/**
 * Native bridge for Ascend. Phase B exposes the two "special" permissions that
 * cannot be granted by a normal popup — the user must toggle them in system
 * Settings, so we expose checkers + openers that JavaScript can call.
 */
/** One monitored app passed from JS to startWatching: package + its daily limit. */
class WatchConfig : Record {
  @Field val packageName: String = ""
  @Field val limitMinutes: Int = 0
}

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
      UsageReader.getUsage(context, packageNames, days)
    }

    // Installed, launchable apps on the device: [{ packageName, name }, ...].
    Function("getInstalledApps") { getInstalledApps() }

    // --- Phase D: background limit watcher --------------------------------
    // Arm/disarm the foreground service that auto-launches friction.
    Function("startWatching") { config: List<WatchConfig> -> startWatching(config) }
    Function("stopWatching") { stopWatching() }
    Function("isWatching") { MonitorStore.isEnabled(context) }

    // JS pushes friction outcomes here so the service stays in sync without
    // needing the JS app running. (untilMs is epoch ms; comes through as Double.)
    Function("setGrace") { packageName: String, untilMs: Double ->
      MonitorStore.setGrace(context, packageName, untilMs.toLong())
    }
    Function("setBlockedToday") { packageName: String ->
      MonitorStore.setBlockedToday(context, packageName)
    }
    Function("clearFriction") { packageName: String ->
      MonitorStore.clearFriction(context, packageName)
    }
    Function("clearAllFriction") { MonitorStore.clearAllFriction(context) }
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
   * Arm the background watcher: persist the per-app limits, flip enabled on, and
   * start the foreground service. (Usage logic itself lives in UsageReader, which
   * both this module's getUsage and the service share.)
   */
  private fun startWatching(config: List<WatchConfig>) {
    MonitorStore.setConfig(context, config.associate { it.packageName to it.limitMinutes })
    MonitorStore.setEnabled(context, true)
    ContextCompat.startForegroundService(context, Intent(context, MonitorService::class.java))
  }

  /** Disarm: flip enabled off (the service stops itself on its next tick) and stop it now. */
  private fun stopWatching() {
    MonitorStore.setEnabled(context, false)
    context.stopService(Intent(context, MonitorService::class.java))
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
}
