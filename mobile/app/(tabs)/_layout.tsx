import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, fonts, sizes } from '../../src/theme';

export default function TabsLayout() {
  return (
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
  );
}
