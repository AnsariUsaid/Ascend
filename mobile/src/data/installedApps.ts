import AscendNative from '../../modules/ascend-native';
import { appMeta } from './appMeta';

export type InstalledApp = {
  packageName: string;
  name: string;
  glyph: string;
  hue: number;
};

let cache: InstalledApp[] | null = null;

/** All launchable apps on the device, with chip metadata. Cached after first call. */
export function getInstalledApps(): InstalledApp[] {
  if (cache) return cache;
  let raw: { packageName: string; name: string }[] = [];
  try {
    raw = AscendNative.getInstalledApps();
  } catch {
    raw = [];
  }
  cache = raw.map((a) => ({ packageName: a.packageName, name: a.name, ...appMeta(a.packageName, a.name) }));
  return cache;
}

/** Metadata for one package (falls back to derived metadata if not installed/known). */
export function getApp(packageName: string): InstalledApp {
  const found = getInstalledApps().find((a) => a.packageName === packageName);
  if (found) return found;
  return { packageName, name: packageName, ...appMeta(packageName, packageName) };
}
