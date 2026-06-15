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
}

// requireNativeModule looks up the module registered as "AscendNative"
// (the Name(...) in the Kotlin) and returns it, typed as our interface.
export default requireNativeModule<AscendNativeModule>('AscendNative');
