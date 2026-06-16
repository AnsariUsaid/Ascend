import { Stack } from 'expo-router';
import { colors } from '../../src/theme';
import { useStatusBarStyle } from '../../src/hooks/useStatusBarStyle';

export default function OnboardingLayout() {
  useStatusBarStyle('dark'); // cream onboarding screens → dark icons
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    />
  );
}
