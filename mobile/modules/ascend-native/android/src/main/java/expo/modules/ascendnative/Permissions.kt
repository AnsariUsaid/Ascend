package expo.modules.ascendnative

import android.app.AppOpsManager
import android.content.Context
import android.os.Build
import android.os.Process
import android.provider.Settings

/**
 * The two "special" permissions the watcher can't work without, shared by the
 * JS-facing module and the background service.
 */
object Permissions {
  /**
   * Usage Access (PACKAGE_USAGE_STATS) isn't a runtime permission — it's an
   * "app op" the user grants in a special settings screen. We check it via
   * AppOpsManager.
   */
  fun hasUsageAccess(context: Context): Boolean {
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

  /** Overlay (SYSTEM_ALERT_WINDOW) has a dedicated framework check. */
  fun hasOverlay(context: Context): Boolean = Settings.canDrawOverlays(context)
}
