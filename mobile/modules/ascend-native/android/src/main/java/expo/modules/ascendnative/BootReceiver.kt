package expo.modules.ascendnative

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/**
 * Restarts the watcher after a reboot or an app update. Android clears
 * foreground services on shutdown, and an update kills our process, so without
 * this the user would have to reopen Ascend to re-arm it. We only restart if the
 * user actually had watching enabled.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
      intent.action != Intent.ACTION_MY_PACKAGE_REPLACED
    ) return
    if (!MonitorStore.isEnabled(context)) return
    ContextCompat.startForegroundService(context, Intent(context, MonitorService::class.java))
  }
}
