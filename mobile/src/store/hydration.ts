// Tracks failed loads of the persisted stores. zustand never marks a store
// hydrated when its storage read or JSON parse fails, so anything waiting on
// hydration would wait forever. We retry once, then give up and let the store
// run on its defaults (how it behaved before we waited at all).

const failures: Record<string, number> = {};
const giveUpListeners = new Set<() => void>();

/** Call from a store's `onRehydrateStorage` result: retry a failed load once, then give up. */
export const onLoadResult = (name: string, error: unknown, retry: () => void) => {
  if (!error) return;
  failures[name] = (failures[name] ?? 0) + 1;
  if (failures[name] === 1) setTimeout(retry, 300);
  else giveUpListeners.forEach((cb) => cb());
};

/** True once a store has failed to load twice and is running on defaults. */
export const gaveUp = (name: string) => (failures[name] ?? 0) >= 2;

export const onGiveUp = (cb: () => void) => {
  giveUpListeners.add(cb);
  return () => {
    giveUpListeners.delete(cb);
  };
};
