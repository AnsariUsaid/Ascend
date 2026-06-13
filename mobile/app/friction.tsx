import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AppChip, Button, Wordmark } from '../src/components';
import { appHues, colors, fonts, radius } from '../src/theme';
import { useAppStore } from '../src/store/useAppStore';
import { generateQuestion, normalizeAnswer, typingAccuracy } from '../src/data/questions';

type Phase = 'question' | 'correct' | 'done';

export default function Friction() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const questionType = useAppStore((s) => s.questionType);
  const grace = useAppStore((s) => s.gracePeriod);

  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>('question');
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [q, setQ] = useState(() => generateQuestion(questionType, 1));

  const isTyping = questionType === 'typing';
  const ref = q.reference ?? '';
  const accuracy = useMemo(
    () => (isTyping ? typingAccuracy(input, ref) : 100),
    [input, ref, isTyping],
  );
  const canCheck = isTyping ? input.length >= ref.length : input.trim().length > 0;

  const newQuestion = (lvl: number) => {
    setQ(generateQuestion(questionType, lvl));
    setInput('');
    setWrong(false);
  };

  const check = () => {
    const ok =
      isTyping ? input === ref : normalizeAnswer(input) === normalizeAnswer(q.answer);
    if (ok) {
      setPhase('correct');
    } else {
      setWrong(true);
    }
  };

  const skip = () => {
    const next = level + 1;
    setLevel(next);
    setEscalated(true);
    newQuestion(next);
  };

  return (
    <View style={styles.scrim}>
      <View style={[styles.card, { paddingBottom: insets.bottom + 20 }]}>
        {phase === 'question' && (
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.topRow}>
              <Wordmark size={15} />
              <View style={styles.levelChip}>
                <Text style={styles.levelChipText}>Level {level}</Text>
              </View>
            </View>

            <View style={styles.blockedRow}>
              <AppChip hue={appHues.instagram} glyph="I" size={32} />
              <Text style={styles.blockedText}>
                You've used <Text style={styles.bold}>Instagram</Text> for 2 hours today.
              </Text>
            </View>

            <Text style={styles.reward}>
              Solve to earn <Text style={styles.bold}>{grace} more minutes</Text>
            </Text>

            {escalated ? (
              <View style={styles.escalatedBanner}>
                <Feather name="trending-up" size={15} color={colors.cream} />
                <Text style={styles.escalatedText}>Difficulty escalated to Level {level}</Text>
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
                    { color: accuracy >= 95 ? colors.successText : accuracy >= 80 ? colors.coffee : colors.coffee },
                  ]}
                >
                  Accuracy: {accuracy}%
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.question}>{q.prompt}</Text>
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
                <Pressable onPress={skip}>
                  <Text style={styles.link}>Skip question</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Pressable onPress={() => setPhase('done')}>
                <Text style={styles.link}>I'm done for today</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {phase === 'correct' && <GraceState minutes={grace} onBack={() => router.back()} />}

        {phase === 'done' && (
          <View style={styles.center}>
            <Feather name="moon" size={40} color={colors.cream} />
            <Text style={styles.bigTitle}>Done for today</Text>
            <Text style={styles.bigSub}>
              Instagram is blocked for the rest of the day. Come back tomorrow with a fresh streak.
            </Text>
            <Button label="Close" variant="google" onPress={() => router.back()} style={{ marginTop: 24, alignSelf: 'stretch' }} />
          </View>
        )}
      </View>
    </View>
  );
}

function GraceState({ minutes, onBack }: { minutes: number; onBack: () => void }) {
  const [secs, setSecs] = useState(minutes * 60);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = Math.floor(secs / 60).toString().padStart(2, '0');
  const ss = (secs % 60).toString().padStart(2, '0');
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
