import { requireNativeModule } from 'expo-modules-core';

/**
 * The shape of our Kotlin module, mirrored in TypeScript. The method names here
 * must match the Function(...) names declared in AscendNativeModule.kt.
 */
export interface AscendNativeModule {
  /** True if the user has granted Usage Access (PACKAGE_USAGE_STATS). */
  hasUsageAccess(): boolean;
  /** Opens the system Usage Access settings screen. */
  openUsageAccessSettings(): void;
  /** True if the user has granted "Display over other apps" (SYSTEM_ALERT_WINDOW). */
  hasOverlayPermission(): boolean;
  /** Opens the system overlay-permission settings screen. */
  openOverlaySettings(): void;

  /**
   * Foreground minutes per package for the last `days` days.
   * Returns `{ [packageName]: number[] }`, each array length `days`,
   * index 0 = oldest day, last index = today. Zeros if usage access is off.
   */
  getUsage(packageNames: string[], days: number): Record<string, number[]>;

  /** Launchable apps installed on the device. */
  getInstalledApps(): { packageName: string; name: string }[];

  // --- Phase D: background limit watcher ---

  /**
   * Arm the foreground service that auto-launches friction when a monitored app
   * goes over its limit. Persists the config + enabled flag, so it survives
   * reboot (BootReceiver re-arms it).
   */
  startWatching(config: { packageName: string; limitMinutes: number }[]): void;
  /** Disarm + stop the foreground service. */
  stopWatching(): void;
  /** Whether the watcher is currently armed (enabled flag in SharedPreferences). */
  isWatching(): boolean;

  /** Tell native that `packageName` has grace until `untilMs` (epoch ms). */
  setGrace(packageName: string, untilMs: number): void;
  /** Tell native that `packageName` is blocked for the rest of today. */
  setBlockedToday(packageName: string): void;
  /** Clear grace + blocked for one app (e.g. answered, or per-app reset). */
  clearFriction(packageName: string): void;
  /** Clear all grace + blocked state (midnight reset / dev reset). */
  clearAllFriction(): void;

  // --- Phase E: keep-alive / reliability ---

  /** True if Ascend is exempt from battery optimization (won't be force-killed). */
  isIgnoringBatteryOptimizations(): boolean;
  /** Open the system battery-optimization list so the user can exempt Ascend. */
  openBatteryOptimizationSettings(): void;
  /** True if notifications are enabled (Android 13+ gates the FGS notification). */
  hasNotificationPermission(): boolean;
  /** Open Ascend's notification settings so the user can enable them. */
  openNotificationSettings(): void;
  /** Fire the one-tap "Allow notifications?" system dialog (Android 13+; no-op before). */
  requestNotificationPermission(): void;

  /** Send Ascend to the background, returning the user to their previous app. */
  returnToPreviousApp(): void;
}

// requireNativeModule looks up the module registered as "AscendNative"
// (the Name(...) in the Kotlin) and returns it, typed as our interface.
export default requireNativeModule<AscendNativeModule>('AscendNative');
