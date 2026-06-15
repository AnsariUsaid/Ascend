/**
 * Time-limit bounds for monitored apps. The list of apps themselves is now read
 * live from the device (see src/data/installedApps.ts) and identified by package
 * name, so there's no hardcoded app catalog here anymore.
 */
export const LIMIT_MIN = 15; // minutes
export const LIMIT_MAX = 240; // 4 hours
export const LIMIT_STEP = 15;
export const DEFAULT_LIMIT = 60;
