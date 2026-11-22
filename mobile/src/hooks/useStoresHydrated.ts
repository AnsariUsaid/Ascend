import { useSyncExternalStore } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useFrictionStore } from '../store/useFrictionStore';
import { useQuestionPackStore } from '../data/questionPacks';
import { hydrationFailed, onHydrationFailureChange } from '../store/hydration';

// The question pack is included so a resumed question is looked up in the right pack.
const stores = [useAppStore.persist, useFrictionStore.persist, useQuestionPackStore.persist];
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
