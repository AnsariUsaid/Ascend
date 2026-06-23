import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button,
  ChoiceChips,
  ConfirmDialog,
  ProtectionCard,
  SettingsRow,
  Sheet,
  Toggle,
} from '../../src/components';
import { colors, fonts, radius, spacing } from '../../src/theme';
import { useAppStore, QuestionType, GracePeriod } from '../../src/store/useAppStore';
import { useFrictionStore } from '../../src/store/useFrictionStore';
import { useUsage } from '../../src/usage/useUsage';
import AscendNative from '../../modules/ascend-native';

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
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = useAppStore();
  const count = s.selectedKeys().length;
  const { streak } = useUsage();

  const [sheet, setSheet] = useState<null | 'question' | 'grace' | 'name'>(null);
  const [confirm, setConfirm] = useState<null | 'delete'>(null);
  const [nameDraft, setNameDraft] = useState(s.displayName);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: spacing.screenH,
          paddingBottom: 40,
        }}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Profile card */}
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{s.displayName.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.name}>{s.displayName}</Text>
            <Text style={styles.email}>Keep climbing</Text>
          </View>
          <View style={styles.streakPill}>
            <Text style={styles.streakPillText}>{streak}-day streak</Text>
          </View>
        </View>

        {/* Phase E: live permission/reliability status + one-tap fixes. */}
        <ProtectionCard />

        <Section label="APP CONTROLS">
          <SettingsRow label="Monitored Apps" value={`${count} apps`} onPress={() => router.push('/edit-apps')} />
          <SettingsRow label="Time Limits" onPress={() => router.push('/edit-limits')} last />
        </Section>

        <Section label="FRICTION SETTINGS">
          <SettingsRow label="Question Type" value={cap(s.questionType)} onPress={() => setSheet('question')} />
          <SettingsRow label="Grace Period" value={`${s.gracePeriod} minutes`} onPress={() => setSheet('grace')} />
          <SettingsRow
            label="Display Name"
            value={s.displayName}
            onPress={() => {
              setNameDraft(s.displayName);
              setSheet('name');
            }}
            last
          />
        </Section>

        <Section label="GENERAL">
          <SettingsRow label="Notifications" right={<Toggle value={s.notifications} onChange={s.setNotifications} />} />
          <SettingsRow label="Clear all data" danger onPress={() => setConfirm('delete')} last />
        </Section>

        <Text style={styles.footer}>Ascend 1.0 · data stays on this device</Text>
      </ScrollView>

      {/* Pickers */}
      <Sheet visible={sheet === 'question'} title="Question Type" onClose={() => setSheet(null)}>
        <ChoiceChips options={QUESTION_TYPES} value={s.questionType} onSelect={(v) => { s.setQuestionType(v); setSheet(null); }} />
      </Sheet>
      <Sheet visible={sheet === 'grace'} title="Grace Period" onClose={() => setSheet(null)}>
        <ChoiceChips options={GRACE} value={s.gracePeriod} onSelect={(v) => { s.setGracePeriod(v); setSheet(null); }} />
      </Sheet>
      <Sheet visible={sheet === 'name'} title="Display Name" onClose={() => setSheet(null)}>
        <TextInput
          value={nameDraft}
          onChangeText={setNameDraft}
          maxLength={16}
          placeholder="Display name"
          placeholderTextColor={colors.faint}
          style={styles.input}
        />
        <Button
          label="Save"
          onPress={() => {
            if (nameDraft.trim().length >= 3) {
              s.setDisplayName(nameDraft.trim());
              setSheet(null);
            }
          }}
          style={{ marginTop: 16 }}
        />
      </Sheet>

      {/* Destructive confirmations */}
      <ConfirmDialog
        visible={confirm === 'delete'}
        title="Clear all data?"
        message="This permanently erases your usage history, limits and streak from this device. This cannot be undone."
        confirmLabel="Clear"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          // v1 is fully local — this is a full local wipe / fresh start.
          useFrictionStore.getState().resetDay(); // clears friction + native grace/blocked
          try { AscendNative.stopWatching(); } catch {} // disarm the background watcher
          s.reset(); // reset all config (onboarded → false → reopen lands on welcome)
          router.replace('/sign-in');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displayXBold, fontSize: 27, color: colors.ink, marginBottom: 18 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f6ddd2',
    borderWidth: 2,
    borderColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.coralText },
  name: { fontFamily: fonts.displayXBold, fontSize: 18, color: colors.ink },
  email: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted2, marginTop: 2 },
  streakPill: { backgroundColor: 'rgba(210,96,63,0.12)', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  streakPillText: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.coralText },

  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    letterSpacing: 0.14 * 12.5,
    color: colors.muted2,
    marginBottom: 10,
  },
  group: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.muted3,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  footer: { fontFamily: fonts.regular, fontSize: 12.5, color: colors.faint, textAlign: 'center', marginTop: 28 },
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
});
