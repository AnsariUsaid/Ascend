import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useFrictionStore } from '../store/useFrictionStore';

// Both stores load from AsyncStorage asynchronously. Until they finish, they hold
// their defaults (question type "math", level 1, no apps), which is wrong data.
const allHydrated = () =>
  useAppStore.persist.hasHydrated() && useFrictionStore.persist.hasHydrated();

/** True once the saved config and friction state have finished loading. */
export function useStoresHydrated(): boolean {
  const [ready, setReady] = useState(allHydrated);
  useEffect(() => {
    if (ready) return;
    const done = () => {
      if (allHydrated()) setReady(true);
    };
    const unsubs = [
      useAppStore.persist.onFinishHydration(done),
      useFrictionStore.persist.onFinishHydration(done),
    ];
    done(); // may have finished between render and this effect
    return () => unsubs.forEach((u) => u());
  }, [ready]);
  return ready;
}
