import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppChip, Button, Wordmark } from '../src/components';
import { colors, fonts, radius } from '../src/theme';
import { useAppStore } from '../src/store/useAppStore';
import { useFrictionStore } from '../src/store/useFrictionStore';
import { getQuestion, findQuestion, normalizeMath, fuzzyMatches, typingAccuracy, typingThreshold, MAX_LEVEL } from '../src/data/questionBank';
import { getApp } from '../src/data/installedApps';
import { useStatusBarStyle } from '../src/hooks/useStatusBarStyle';
import { useStoresHydrated } from '../src/hooks/useStoresHydrated';
import AscendNative from '../modules/ascend-native';

type Phase = 'question' | 'correct' | 'done' | 'exhausted';

export default function Friction() {
  useStatusBarStyle('light'); // dark scrim + coral sheet → white icons
  const params = useLocalSearchParams<{ app?: string }>();
  const { status, retry } = useStoresHydrated();
  const insets = useSafeAreaInsets();

  // Block the hardware Back button — friction can only be left via the on-screen
  // actions (solve / skip / "I'm done" / "Back to app"), not by backing out.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // On a cold start the saved settings/level are still loading; reading them now
  // would serve the default type at level 1. Keep the challenge gated until both load.
  if (status === 'error') {
    return (
      <View style={styles.scrim}>
        <View style={[styles.card, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.center}>
            <Text accessibilityRole="alert" style={styles.bigTitle}>Couldn't load your challenge</Text>
            <Text style={styles.bigSub}>Try loading your saved settings and progress again.</Text>
            <Button label="Retry" variant="google" onPress={retry} style={{ marginTop: 24, alignSelf: 'stretch' }} />
          </View>
        </View>
      </View>
    );
  }
  if (status === 'loading') return <View style={styles.scrim} />;

  // Keyed on the app so a new trigger for a different app remounts with that
  // app's own state instead of reusing this one's question and level.
  const appParam = params.app ?? '';
  return <FrictionScreen key={appParam} appParam={appParam} />;
}

function FrictionScreen({ appParam }: { appParam: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const questionType = useAppStore((s) => s.questionType);
  const grace = useAppStore((s) => s.gracePeriod);

  const { ensureToday, answerCorrect, answerWrong, setCurrentQ, skip, doneForToday } = useFrictionStore();

  // Resolve which app triggered the overlay.
  // `appParam` is a package name (passed by the dashboard / Phase D trigger).
  const app = getApp(appParam);
  const appKey = app.packageName;

  // Snapshot the starting level once (engine state lives in the store; its reads
  // are day-aware, so yesterday's level never leaks into a new day).
  // The question type is locked into `current` so a later settings change can't
  // mismatch it with the question on screen.
  // Resume the question already shown for this app, so leaving and reopening
  // friction can't be used to re-roll for an easier one.
  const [current, setCurrent] = useState(() => {
    const appState = useFrictionStore.getState().getApp(appKey);
    const saved = appState.currentQ;
    const resumed =
      saved && saved.type === questionType && saved.level === appState.level
        ? findQuestion(questionType, appState.level, saved.id)
        : undefined;
    return {
      q: resumed ?? getQuestion(questionType, appState.level),
      level: appState.level,
      type: questionType,
    };
  });
  const [phase, setPhase] = useState<Phase>(() => {
    const a = useFrictionStore.getState().getApp(appKey);
    if (a.blockedForToday) return 'done';
    // Past the top of the ladder → cleared every level today, no more questions.
    if (a.level > MAX_LEVEL) return 'exhausted';
    return 'question';
  });
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState<string | null>(null); // chosen multiple-choice option
  const [wrong, setWrong] = useState(false);
  const [escalated, setEscalated] = useState(false);
  // A wrong answer happened → offer Skip (also after reopening mid-streak).
  const [missed, setMissed] = useState(() => useFrictionStore.getState().getApp(appKey).wrongStreak > 0);
  const [graceExpiresAt, setGraceExpiresAt] = useState<number | null>(null);
  // Answer lockout after a wrong answer (stored per app, so closing the screen doesn't clear it).
  const [lockedUntil, setLockedUntil] = useState<number | null>(
    () => useFrictionStore.getState().getApp(appKey).lockedUntil,
  );
  const [now, setNow] = useState(Date.now());
  const lockLeft = lockedUntil ? Math.max(0, Math.ceil((lockedUntil - now) / 1000)) : 0;
  useEffect(() => {
    if (lockLeft <= 0) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [lockLeft > 0]);

  // Persist the day rollover (reads already treat an old day as fresh).
  useEffect(() => {
    ensureToday();
  }, []);

  // Persist whichever question is on screen (initial, after a miss, or after a skip).
  useEffect(() => {
    if (phase !== 'question') return;
    setCurrentQ(appKey, { type: current.type, level: current.level, id: current.q.id });
  }, [current.q.id, current.level]);

  // Ignore a second tap that lands before the screen updates — otherwise a fast
  // double tap on Check/Skip runs the action twice (e.g. climbs two levels).
  const busy = useRef(false);
  const once = (fn: () => void) => () => {
    if (busy.current) return;
    busy.current = true;
    setTimeout(() => {
      busy.current = false;
    }, 400);
    fn();
  };

  const isTyping = current.type === 'typing';
  const ref = current.q.reference ?? '';
  // Multiple-choice questions (logic) carry an `options` array; the rest are typed.
  const options = current.q.options;
  const isMcq = !isTyping && !!options?.length;
  const accuracy = useMemo(
    () => (isTyping ? typingAccuracy(input, ref) : 100),
    [input, ref, isTyping],
  );
  // Per-level character-accuracy bar a typing answer must clear (85% at L1 → 95% at L5).
  const threshold = isTyping ? typingThreshold(current.level) : 100;
  // Must type the whole passage before checking, so a short correct prefix can't pass.
  const canCheck =
    lockLeft === 0 &&
    (isTyping ? input.length >= ref.length : isMcq ? selected !== null : input.trim().length > 0);

  const check = once(() => {
    const ok = isTyping
      ? accuracy >= threshold
      : isMcq
      ? selected === current.q.answer
      : current.type === 'trivia'
      ? fuzzyMatches(input, current.q) // typed trivia (L4-5): lenient match
      : normalizeMath(input) === normalizeMath(current.q.answer); // math: numeric-exact
    if (ok) {
      answerCorrect(appKey, grace);
      setGraceExpiresAt(useFrictionStore.getState().getApp(appKey).graceExpiresAt);
      setPhase('correct');
    } else if (isTyping) {
      // Typing can't be guessed — keep the same passage so they can fix their typos.
      setWrong(true);
      setMissed(true);
    } else {
      // No retrying the same question (that let you tap through every option).
      // Serve a fresh one at the same level, behind a lockout that grows per miss.
      answerWrong(appKey);
      setLockedUntil(useFrictionStore.getState().getApp(appKey).lockedUntil);
      setNow(Date.now());
      setCurrent({ ...current, q: getQuestion(current.type, current.level, current.q.id) });
      setInput('');
      setSelected(null);
      setEscalated(false);
      setWrong(true);
      setMissed(true);
    }
  });

  const onSkip = once(() => {
    if (lockLeft > 0) return; // belt and braces: the link is disabled during the wait
    skip(appKey);
    // Read the level back from the store (the source of truth), not our local copy.
    const nextLevel = Math.min(MAX_LEVEL, useFrictionStore.getState().getApp(appKey).level);
    setCurrent({ ...current, q: getQuestion(current.type, nextLevel, current.q.id), level: nextLevel });
    setInput('');
    setSelected(null);
    setWrong(false);
    setEscalated(nextLevel > current.level); // at the cap it re-serves L5 without escalating
    // Skipping at the cap is charged a lockout (see store) — reflect it on screen.
    setLockedUntil(useFrictionStore.getState().getApp(appKey).lockedUntil);
    setNow(Date.now());
  });

  const onDone = once(() => {
    doneForToday(appKey);
    setPhase('done');
  });

  // After earning grace, send Ascend to the background so the user lands back in
  // the app they were using (not on Ascend's dashboard). Falls back to a normal
  // dismiss if the native call is unavailable (older build).
  const backToApp = () => {
    try {
      AscendNative.returnToPreviousApp();
    } catch {}
    router.back();
  };

  return (
    <View style={styles.scrim}>
      <View style={[styles.card, { paddingBottom: insets.bottom + 20 }]}>
        {phase === 'question' && (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.topRow}>
              <Wordmark size={15} />
              <View style={styles.levelChip}>
                <Text style={styles.levelChipText}>Level {current.level}</Text>
              </View>
            </View>

            <View style={styles.blockedRow}>
              <AppChip hue={app.hue} glyph={app.glyph} size={32} />
              <Text style={styles.blockedText}>
                You've reached your limit on <Text style={styles.bold}>{app.name}</Text> today.
              </Text>
            </View>

            <Text style={styles.reward}>
              Solve to earn <Text style={styles.bold}>{grace} more minutes</Text>
            </Text>

            {escalated ? (
              <View style={styles.escalatedBanner}>
                <Feather name="trending-up" size={15} color={colors.cream} />
                <Text style={styles.escalatedText}>Difficulty escalated to Level {current.level}</Text>
              </View>
            ) : null}

            {isTyping ? (
              <>
                <Text style={styles.label}>Type this sentence to earn {grace} more minutes</Text>
                <View style={styles.refCard}>
                  <Text style={styles.refText}>{ref}</Text>
                </View>
                <TextInput
                  value={input}
                  onChangeText={(t) => {
                    setInput(t);
                    setWrong(false);
                  }}
                  placeholder="Start typing…"
                  placeholderTextColor="rgba(34,26,19,0.4)"
                  multiline
                  style={[styles.input, styles.textarea]}
                />
                <Text
                  style={[
                    styles.accuracy,
                    { color: accuracy >= threshold ? colors.successText : colors.coffee },
                  ]}
                >
                  Accuracy: {accuracy}% · need {threshold}%
                </Text>
              </>
            ) : isMcq ? (
              <>
                <Text style={styles.mcqPrompt}>{current.q.prompt}</Text>
                <View style={styles.optionsWrap}>
                  {options!.map((opt) => {
                    const sel = selected === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => {
                          setSelected(opt);
                          setWrong(false);
                        }}
                        style={[styles.option, sel && styles.optionSelected]}
                      >
                        <View style={[styles.radio, sel && styles.radioSelected]}>
                          {sel ? <Feather name="check" size={13} color={colors.coral} /> : null}
                        </View>
                        <Text style={[styles.optionText, sel && styles.optionTextSelected]}>{opt}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.question}>{current.q.prompt}</Text>
                <TextInput
                  value={input}
                  onChangeText={(t) => {
                    setInput(t);
                    setWrong(false);
                  }}
                  placeholder="Your answer"
                  placeholderTextColor="rgba(34,26,19,0.4)"
                  style={styles.input}
                  autoFocus
                />
              </>
            )}

            {wrong ? (
              <Text style={styles.wrong}>
                {isTyping
                  ? 'Not quite. Fix a few typos and try again, or skip to a new (harder) one.'
                  : 'Not quite. Here\'s a fresh question. Take a moment, or skip to a harder one.'}
              </Text>
            ) : null}

            <Button
              label={lockLeft > 0 ? `Answer in ${lockLeft}s` : 'Check Answer'}
              variant="coffee"
              onPress={check}
              disabled={!canCheck}
              style={{ marginTop: 18 }}
            />

            <View style={styles.linksRow}>
              {missed ? (
                // Locked during the answer wait too, or skipping would be an instant re-roll.
                <Pressable onPress={onSkip} disabled={lockLeft > 0}>
                  <Text style={[styles.link, lockLeft > 0 && styles.linkDisabled]}>Skip question</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Pressable onPress={onDone}>
                <Text style={styles.link}>I'm done for today</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {phase === 'correct' && (
          <GraceState minutes={grace} expiresAt={graceExpiresAt} onBack={backToApp} />
        )}

        {phase === 'done' && (
          <View style={styles.center}>
            <Feather name="moon" size={40} color={colors.cream} />
            <Text style={styles.bigTitle}>Done for today</Text>
            <Text style={styles.bigSub}>
              {app.name} is blocked for the rest of the day. Come back tomorrow with a fresh streak.
            </Text>
            <Button label="Close" variant="google" onPress={() => router.back()} style={{ marginTop: 24, alignSelf: 'stretch' }} />
          </View>
        )}

        {phase === 'exhausted' && (
          <View style={styles.center}>
            <Feather name="award" size={40} color={colors.cream} />
            <Text style={styles.bigTitle}>You've cleared every level</Text>
            <Text style={styles.bigSub}>
              That's all the time Ascend will unlock for {app.name} today. Rest up and come back
              tomorrow with a fresh streak.
            </Text>
            <Button
              label="I'm done for today"
              variant="google"
              onPress={once(() => {
                doneForToday(appKey);
                router.back();
              })}
              style={{ marginTop: 24, alignSelf: 'stretch' }}
            />
          </View>
        )}
      </View>
    </View>
  );
}

function GraceState({
  minutes,
  expiresAt,
  onBack,
}: {
  minutes: number;
  expiresAt: number | null;
  onBack: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : minutes * 60;
  const mm = Math.floor(remaining / 60).toString().padStart(2, '0');
  const ss = (remaining % 60).toString().padStart(2, '0');
  return (
    <View style={styles.center}>
      <View style={styles.checkCircle}>
        <Feather name="check" size={36} color={colors.coral} />
      </View>
      <Text style={styles.bigTitle}>Nice — {minutes} more minutes</Text>
      <View style={styles.gracePill}>
        <Text style={styles.gracePillText}>{mm}:{ss}</Text>
      </View>
      <Button label="Back to app" variant="google" onPress={onBack} style={{ marginTop: 24, alignSelf: 'stretch' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(20,13,8,0.55)', justifyContent: 'flex-end' },
  card: {
    height: '78%',
    backgroundColor: colors.coral,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelChip: { backgroundColor: 'rgba(251,244,234,0.18)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  levelChipText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.cream },

  blockedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 28 },
  blockedText: { flex: 1, marginLeft: 12, fontFamily: fonts.regular, fontSize: 15.5, lineHeight: 22, color: colors.cream },
  bold: { fontFamily: fonts.semibold },
  reward: { marginTop: 16, fontFamily: fonts.regular, fontSize: 15, color: 'rgba(251,244,234,0.9)' },

  escalatedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: 'rgba(34,26,19,0.35)', borderRadius: 12, padding: 10 },
  escalatedText: { fontFamily: fonts.medium, fontSize: 13, color: colors.cream },

  question: { marginTop: 26, fontFamily: fonts.display, fontSize: 26, lineHeight: 34, color: colors.cream },

  // Multiple-choice (logic): smaller prompt for longer text + tappable option cards.
  mcqPrompt: { marginTop: 24, fontFamily: fonts.display, fontSize: 18.5, lineHeight: 26, color: colors.cream },
  optionsWrap: { marginTop: 18, gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(251,244,234,0.12)',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: { backgroundColor: colors.cream, borderColor: colors.cream },
  optionText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.cream },
  optionTextSelected: { fontFamily: fonts.semibold, color: colors.ink },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(251,244,234,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: colors.cream, borderColor: colors.cream },

  label: { marginTop: 24, fontFamily: fonts.medium, fontSize: 14, color: 'rgba(251,244,234,0.9)' },
  refCard: { marginTop: 12, backgroundColor: 'rgba(251,244,234,0.12)', borderRadius: 14, padding: 14 },
  refText: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24, color: colors.cream },

  input: {
    marginTop: 16,
    backgroundColor: colors.cream,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    fontFamily: fonts.medium,
    fontSize: 17,
    color: colors.ink,
  },
  textarea: { height: 110, paddingTop: 14, textAlignVertical: 'top' },
  accuracy: { marginTop: 10, fontFamily: fonts.semibold, fontSize: 14 },
  wrong: { marginTop: 14, fontFamily: fonts.medium, fontSize: 13.5, color: '#3a2a1f' },

  linksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  link: { fontFamily: fonts.medium, fontSize: 14, color: 'rgba(251,244,234,0.75)', textDecorationLine: 'underline' },
  linkDisabled: { opacity: 0.35 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  checkCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  bigTitle: { marginTop: 22, fontFamily: fonts.displayXBold, fontSize: 26, color: colors.cream, textAlign: 'center' },
  bigSub: { marginTop: 12, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: 'rgba(251,244,234,0.8)', textAlign: 'center' },
  gracePill: { marginTop: 20, backgroundColor: 'rgba(34,26,19,0.35)', borderRadius: radius.pill, paddingHorizontal: 22, paddingVertical: 10 },
  gracePillText: { fontFamily: fonts.displayXBold, fontSize: 22, color: colors.cream, letterSpacing: 1 },
});
