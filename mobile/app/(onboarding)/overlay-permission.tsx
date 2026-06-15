import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Button, Card, OnboardingShell, PermissionBanner } from '../../src/components';
import { colors, fonts } from '../../src/theme';
import { usePermissionStatus } from '../../src/hooks/usePermissionStatus';
import AscendNative from '../../modules/ascend-native';

const BULLETS = [
  'Intervention screens must draw over the app you are using.',
  'Without it, the friction challenge cannot be enforced.',
  'Ascend only shows the overlay when a limit is reached.',
];

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <View style={styles.dot} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export default function OverlayPermission() {
  const router = useRouter();
  const { granted } = usePermissionStatus(AscendNative.hasOverlayPermission);
  const [attempted, setAttempted] = useState(false);

  const next = () => router.push('/(onboarding)/select-apps');

  return (
    <OnboardingShell
      step={2}
      footer={
        granted ? (
          <Button label="Continue" onPress={next} />
        ) : (
          <>
            <Button
              label="Allow Overlay"
              onPress={() => {
                setAttempted(true);
                AscendNative.openOverlaySettings();
              }}
            />
            <Button label="I'll do this later" variant="text" onPress={next} />
          </>
        )
      }
    >
      <Card style={styles.illus}>
        <View style={styles.phone}>
          <View style={styles.overlayCard}>
            <Feather name="layers" size={26} color={colors.cream} />
          </View>
        </View>
      </Card>
      <Text style={styles.headline}>Draw over other apps</Text>

      {(granted || attempted) && (
        <PermissionBanner
          granted={granted}
          grantedText="Overlay permission granted. Friction screens can appear when needed."
          reminderText="Without overlay permission, friction challenges can't be shown over other apps. You can continue and grant it later in Settings."
        />
      )}

      <View style={{ marginTop: 16 }}>
        {BULLETS.map((b) => (
          <Bullet key={b} text={b} />
        ))}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  illus: { alignItems: 'center', paddingVertical: 24 },
  phone: {
    width: 96,
    height: 70,
    borderRadius: 14,
    backgroundColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    width: 64,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: { marginTop: 22, fontFamily: fonts.displayXBold, fontSize: 24, color: colors.ink },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.coral, marginTop: 7, marginRight: 12 },
  bulletText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
});
