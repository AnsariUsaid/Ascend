import { useSyncExternalStore } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useFrictionStore } from '../store/useFrictionStore';
import { hydrationFailed, onHydrationFailureChange } from '../store/hydration';

const stores = [useAppStore.persist, useFrictionStore.persist];
const hasFailed = (store: (typeof stores)[number]) => {
  const { name } = store.getOptions();
  return name !== undefined && hydrationFailed(name);
};

const getStatus = () => {
  if (stores.some(hasFailed)) return 'error';
  return stores.every((store) => store.hasHydrated()) ? 'ready' : 'loading';
};

const subscribe = (listener: () => void) => {
  const unsubs = [
    onHydrationFailureChange(listener),
    ...stores.flatMap((store) => [store.onHydrate(listener), store.onFinishHydration(listener)]),
  ];
  return () => unsubs.forEach((unsubscribe) => unsubscribe());
};

const retry = () => {
  for (const store of stores) {
    if (hasFailed(store)) void store.rehydrate();
  }
};

export function useStoresHydrated() {
  const status = useSyncExternalStore(subscribe, getStatus, getStatus);
  return { status, retry };
}
