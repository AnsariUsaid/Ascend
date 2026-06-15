package expo.modules.ascendnative

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
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
}
