import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, sizes } from '../../src/theme';
import { PermissionGate } from '../../src/components';
import { useStatusBarStyle } from '../../src/hooks/useStatusBarStyle';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark'); // cream tab screens → dark icons
  return (
    <View style={{ flex: 1 }}>
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.muted3,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 11.5,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={sizes.navIcon} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => (
            <Feather name="bar-chart-2" size={sizes.navIcon} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => <Feather name="award" size={sizes.navIcon} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Feather name="settings" size={sizes.navIcon} color={color} />
          ),
        }}
      />
      </Tabs>
      {/* Fixed cream bar behind the translucent status bar so dark cards scrolling
          up pass under cream (not under the icons), keeping the dark icons legible. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: colors.cream,
        }}
      />
      <PermissionGate />
    </View>
  );
}
