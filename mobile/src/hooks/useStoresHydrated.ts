import { useSyncExternalStore } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useFrictionStore } from '../store/useFrictionStore';
import { useQuestionPackStore } from '../data/questionPacks';
import { hydrationFailed, onHydrationFailureChange } from '../store/hydration';

// The question pack is waited for so a resumed question is looked up in the right pack,
// but it's optional: if it fails to load, questions fall back to the built-in set
// instead of the whole app (and the limit watcher) reporting an error.
const required = [useAppStore.persist, useFrictionStore.persist];
const questionPack = useQuestionPackStore.persist;
const stores = [...required, questionPack];
const hasFailed = (store: (typeof stores)[number]) => {
  const { name } = store.getOptions();
  return name !== undefined && hydrationFailed(name);
};

const getStatus = () => {
  if (required.some(hasFailed)) return 'error';
  const packSettled = questionPack.hasHydrated() || hasFailed(questionPack);
  return packSettled && required.every((store) => store.hasHydrated()) ? 'ready' : 'loading';
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
