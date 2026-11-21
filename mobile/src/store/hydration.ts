// Zustand's finish listeners only fire on success. Keep failures from the
// persist callbacks so a screen that mounts later can still offer a retry.
const failures = new Set<string>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const trackHydration = (name: string) => {
  if (failures.delete(name)) notify();
  return (state: unknown) => {
    // Persist passes no state when hydration fails, even if the error is falsy.
    if (state === undefined) {
      failures.add(name);
      notify();
    }
  };
};

export const hydrationFailed = (name: string) => failures.has(name);

export const onHydrationFailureChange = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
