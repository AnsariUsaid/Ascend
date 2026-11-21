import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useFrictionStore } from '../store/useFrictionStore';
import { gaveUp, onGiveUp } from '../store/hydration';

// Both stores load from AsyncStorage asynchronously. Until they finish, they hold
// their defaults (question type "math", level 1, no apps), which is wrong data.
// A store that failed to load (and failed its retry) counts as settled, so we
// fall back to defaults instead of waiting forever.
const allSettled = () =>
  (useAppStore.persist.hasHydrated() || gaveUp('ascend-config')) &&
  (useFrictionStore.persist.hasHydrated() || gaveUp('ascend-friction'));

/** True once the saved config and friction state have loaded (or failed to load). */
export function useStoresHydrated(): boolean {
  const [ready, setReady] = useState(allSettled);
  useEffect(() => {
    if (ready) return;
    const done = () => {
      if (allSettled()) setReady(true);
    };
    const unsubs = [
      useAppStore.persist.onFinishHydration(done),
      useFrictionStore.persist.onFinishHydration(done),
      onGiveUp(done),
    ];
    done(); // may have finished between render and this effect
    return () => unsubs.forEach((u) => u());
  }, [ready]);
  return ready;
}
