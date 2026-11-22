import { useEffect } from 'react';
import { AppState, Linking } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AscendNative from '../../modules/ascend-native';
import { todayKey } from '../lib/date';

/**
 * Announcements: short notes from us (feedback forms, "a new version is ready")
 * shown as one collapsible pill on Home (not dismissible — remove it from the file to retire it). The source is a public file on the website,
 * downloaded at most once a day. Nothing about the user is sent.
 * Edit web/public/announcements.json to publish.
 */
const SOURCE_URL = 'https://ascend.ansariusaid.me/announcements.json';
// TESTING VALUE: 10 minutes. Set back to 24 * 60 * 60 * 1000 (once a day) before release.
const CHECK_EVERY_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 8000;
const PLAY_LISTING = 'https://play.google.com/store/apps/details?id=me.ansariusaid.ascend';

export type Announcement = {
  id: string;
  title: string;
  body: string;
  button?: string;
  url?: string;
  // Version rules are optional and per item — leave both out to show it to everyone.
  /** Only show to app versions older than this, e.g. "1.0.3". */
  onlyBelow?: string;
  /** Only show to this app version or newer, e.g. "1.0.2". */
  onlyFrom?: string;
  /** "YYYY-MM-DD" — hidden from this day on. */
  expires?: string;
};

type AnnouncementState = {
  items: Announcement[];
  lastChecked: number; // epoch ms of the last successful download
  setItems: (items: Announcement[]) => void;
  reset: () => void;
};

export const useAnnouncementStore = create<AnnouncementState>()(
  persist(
    (set) => ({
      items: [],
      lastChecked: 0,
      setItems: (items) => set({ items, lastChecked: Date.now() }),
      reset: () => set({ items: [], lastChecked: 0 }),
    }),
    {
      name: 'ascend-announcements',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items, lastChecked: s.lastChecked }),
    },
  ),
);

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Keep only well-formed items, so a typo in the file can't break the app. */
function sanitize(data: unknown): Announcement[] {
  const raw = (data as { items?: unknown })?.items;
  if (!Array.isArray(raw)) return [];
  const out: Announcement[] = [];
  for (const r of raw) {
    const id = str(r?.id, 64);
    const title = str(r?.title, 80);
    const body = str(r?.body, 300);
    if (!id || !title || !body) continue;
    const url = str(r?.url, 500);
    const okUrl = /^(https:\/\/|market:\/\/)/.test(url);
    out.push({
      id,
      title,
      body,
      button: okUrl ? str(r?.button, 30) || 'Open' : undefined,
      url: okUrl ? url : undefined,
      onlyBelow: str(r?.onlyBelow, 20) || undefined,
      onlyFrom: str(r?.onlyFrom, 20) || undefined,
      expires: /^\d{4}-\d{2}-\d{2}$/.test(str(r?.expires, 10)) ? str(r?.expires, 10) : undefined,
    });
  }
  return out;
}

/** Download the file if the last successful check was over a day ago. Silent on failure. */
async function checkIfDue() {
  const { lastChecked, setItems } = useAnnouncementStore.getState();
  if (Date.now() - lastChecked < CHECK_EVERY_MS) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(SOURCE_URL, { signal: controller.signal });
    if (!res.ok) return; // try again next time the app opens
    setItems(sanitize(await res.json()));
  } catch {
    // offline / timeout / bad JSON — keep the last copy, retry next open
  } finally {
    clearTimeout(timer);
  }
}

/** -1 if a < b, 0 if equal, 1 if a > b ("1.0.10" > "1.0.9"). */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

function appVersion(): string {
  try {
    return AscendNative.getAppVersion();
  } catch {
    return '';
  }
}

/** Open a link outside Ascend (browser / Play Store), never inside the app. */
export async function openAnnouncementLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    // No Play Store app (market:// fails) — fall back to the web listing.
    if (url.startsWith('market://')) Linking.openURL(PLAY_LISTING).catch(() => {});
  }
}

/** The one announcement to show right now (or null), checking for new ones once a day. */
export function useAnnouncement(): Announcement | null {
  const items = useAnnouncementStore((s) => s.items);

  useEffect(() => {
    checkIfDue();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkIfDue();
    });
    return () => sub.remove();
  }, []);

  const version = appVersion();
  const today = todayKey();
  return (
    items.find(
      (a) =>
        !(a.expires && today >= a.expires) &&
        // Version rules only apply to items that set them; they need a known version.
        (!a.onlyBelow || (!!version && compareVersions(version, a.onlyBelow) < 0)) &&
        (!a.onlyFrom || (!!version && compareVersions(version, a.onlyFrom) >= 0)),
    ) ?? null
  );
}
