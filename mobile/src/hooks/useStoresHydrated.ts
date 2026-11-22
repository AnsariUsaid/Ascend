import { useSyncExternalStore } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useFrictionStore } from '../store/useFrictionStore';
import { useQuestionPackStore } from '../data/questionPacks';
import { useFocusStore } from '../store/useFocusStore';
import { hydrationFailed, onHydrationFailureChange } from '../store/hydration';

// The question pack and Focus session are waited for (so a resumed question is found
// in the right pack, and a running Focus session keeps the watcher on), but they're
// optional: if one fails to load, questions fall back to the built-in set / Focus
// starts fresh, instead of the whole app (and the limit watcher) reporting an error.
const required = [useAppStore.persist, useFrictionStore.persist];
const optional = [useQuestionPackStore.persist, useFocusStore.persist];
const stores = [...required, ...optional];
const hasFailed = (store: (typeof stores)[number]) => {
  const { name } = store.getOptions();
  return name !== undefined && hydrationFailed(name);
};

const getStatus = () => {
  if (required.some(hasFailed)) return 'error';
  const optionalSettled = optional.every((store) => store.hasHydrated() || hasFailed(store));
  return optionalSettled && required.every((store) => store.hasHydrated()) ? 'ready' : 'loading';
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
