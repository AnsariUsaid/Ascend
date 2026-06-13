import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppChip, Button, Wordmark } from '../src/components';
import { colors, fonts, radius } from '../src/theme';
import { useAppStore } from '../src/store/useAppStore';
import { useFrictionStore } from '../src/store/useFrictionStore';
import { getQuestion, normalizeAnswer, typingAccuracy } from '../src/data/questionBank';
import { APP_CATALOG } from '../src/data/apps';

type Phase = 'question' | 'correct' | 'done';

export default function Friction() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ app?: string }>();
  const questionType = useAppStore((s) => s.questionType);
  const grace = useAppStore((s) => s.gracePeriod);

  const { ensureToday, answerCorrect, skip, doneForToday } = useFrictionStore();

  // Resolve which app triggered the overlay.
  const app = APP_CATALOG.find((a) => a.key === params.app) ?? APP_CATALOG[0];

  // Snapshot the starting level once (engine state lives in the store).
  // Day-reset is handled by the dashboard on open and by the effect below.
  const [current, setCurrent] = useState(() => {
    const appState = useFrictionStore.getState().getApp(app.key);
    return { q: getQuestion(questionType, appState.level), level: appState.level };
  });
  const [phase, setPhase] = useState<Phase>(() =>
    useFrictionStore.getState().getApp(app.key).blockedForToday ? 'done' : 'question',
  );
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [graceExpiresAt, setGraceExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    ensureToday();
  }, []);

  const isTyping = questionType === 'typing';
  const ref = current.q.reference ?? '';
  const accuracy = useMemo(
    () => (isTyping ? typingAccuracy(input, ref) : 100),
    [input, ref, isTyping],
  );
  const canCheck = isTyping ? input.length >= ref.length : input.trim().length > 0;

  const check = () => {
    const ok = isTyping
      ? input === ref
      : normalizeAnswer(input) === normalizeAnswer(current.q.answer);
    if (ok) {
      answerCorrect(app.key, grace);
      setGraceExpiresAt(useFrictionStore.getState().getApp(app.key).graceExpiresAt);
      setPhase('correct');
    } else {
      setWrong(true);
    }
  };

  const onSkip = () => {
    skip(app.key);
    const nextLevel = current.level + 1;
    setCurrent({ q: getQuestion(questionType, nextLevel, current.q.id), level: nextLevel });
    setInput('');
    setWrong(false);
    setEscalated(true);
  };

  const onDone = () => {
    doneForToday(app.key);
    setPhase('done');
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
                    { color: accuracy >= 95 ? colors.successText : colors.coffee },
                  ]}
                >
                  Accuracy: {accuracy}%
                </Text>
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
              <Text style={styles.wrong}>Not quite. Try again, or skip to a new (harder) question.</Text>
            ) : null}

            <Button label="Check Answer" variant="coffee" onPress={check} disabled={!canCheck} style={{ marginTop: 18 }} />

            <View style={styles.linksRow}>
              {wrong ? (
                <Pressable onPress={onSkip}>
                  <Text style={styles.link}>Skip question</Text>
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
          <GraceState minutes={grace} expiresAt={graceExpiresAt} onBack={() => router.back()} />
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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  checkCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  bigTitle: { marginTop: 22, fontFamily: fonts.displayXBold, fontSize: 26, color: colors.cream, textAlign: 'center' },
  bigSub: { marginTop: 12, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: 'rgba(251,244,234,0.8)', textAlign: 'center' },
  gracePill: { marginTop: 20, backgroundColor: 'rgba(34,26,19,0.35)', borderRadius: radius.pill, paddingHorizontal: 22, paddingVertical: 10 },
  gracePillText: { fontFamily: fonts.displayXBold, fontSize: 22, color: colors.cream, letterSpacing: 1 },
});
