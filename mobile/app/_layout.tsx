import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
} from '@expo-google-fonts/outfit';
import { colors } from '../src/theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  // While fonts load, hold a coral full-bleed view (matches the splash).
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.coral }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          animation: 'fade',
        }}
      >
        <Stack.Screen
          name="friction"
          options={{ presentation: 'transparentModal', animation: 'fade' }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
