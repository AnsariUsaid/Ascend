import { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ChevronMark, ChoiceChips, OnboardingShell, Wordmark } from '../../src/components';
import { colors, fonts } from '../../src/theme';
import { useAppStore, QuestionType, GracePeriod } from '../../src/store/useAppStore';

const QUESTION_TYPES: { label: string; value: QuestionType }[] = [
  { label: 'Math', value: 'math' },
  { label: 'Trivia', value: 'trivia' },
  { label: 'Logic', value: 'logic' },
  { label: 'Typing', value: 'typing' },
];

const GRACE: { label: string; value: GracePeriod }[] = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
];

function Completion({ onEnter }: { onEnter: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.completion, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.completionCenter}>
        <ChevronMark size={72} />
        <Wordmark size={28} style={{ marginTop: 18 }} />
        <Text style={styles.completionTitle}>You're all set.</Text>
        <Text style={styles.completionSub}>
          Use your phone normally — Ascend is watching. Your friction ladder kicks in when you pass a limit.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 28 }}>
        <Button label="Enter Ascend" variant="google" onPress={onEnter} />
      </View>
    </View>
  );
}

export default function Preferences() {
  const router = useRouter();
  const { displayName, questionType, gracePeriod, setDisplayName, setQuestionType, setGracePeriod, setOnboarded } =
    useAppStore();
  const [name, setName] = useState(displayName);
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);

  const nameError = name.trim().length < 3 || name.trim().length > 16;

  const finish = () => {
    setTouched(true);
    if (nameError) return;
    setDisplayName(name.trim());
    setOnboarded(true); // from now on, the splash sends this user straight to the app
    setDone(true);
  };

  if (done) return <Completion onEnter={() => router.replace('/(tabs)/home')} />;

  return (
    <OnboardingShell step={5} footer={<Button label="Finish Setup" onPress={finish} />}>
      <Text style={styles.headline}>A few final touches</Text>

      <Text style={styles.label}>Display name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Choose a display name"
        placeholderTextColor={colors.faint}
        maxLength={16}
        style={[styles.input, touched && nameError && styles.inputError]}
      />
      {touched && nameError ? (
        <Text style={styles.error}>Use 3–16 characters.</Text>
      ) : (
        <Text style={styles.hint}>Shown on the leaderboard.</Text>
      )}

      <Text style={styles.label}>Challenge type</Text>
      <ChoiceChips options={QUESTION_TYPES} value={questionType} onSelect={setQuestionType} />

      <Text style={styles.label}>Grace period</Text>
      <ChoiceChips options={GRACE} value={gracePeriod} onSelect={setGracePeriod} />
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  headline: { fontFamily: fonts.displayXBold, fontSize: 24, color: colors.ink, marginBottom: 8 },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink, marginTop: 22, marginBottom: 10 },
  input: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
  },
  inputError: { borderColor: colors.dangerText },
  hint: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.muted3, marginTop: 6 },
  error: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.dangerText, marginTop: 6 },

  completion: { flex: 1, backgroundColor: colors.coral, justifyContent: 'space-between' },
  completionCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  completionTitle: { fontFamily: fonts.displayXBold, fontSize: 32, color: colors.cream, marginTop: 28 },
  completionSub: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: 'rgba(251,244,234,0.8)',
    marginTop: 14,
  },
});
