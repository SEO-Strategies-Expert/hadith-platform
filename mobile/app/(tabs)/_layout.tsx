import React from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../src/i18n';
import { colors, fontFamily } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabsLayout() {
  const { t } = useI18n();

  const icon =
    (name: IconName, active: IconName) =>
    ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
      <Ionicons name={focused ? active : name} size={size} color={color} />
    );

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.navyDark },
        headerTintColor: colors.goldLight,
        headerTitleStyle: { fontFamily, fontSize: 16, fontWeight: '700', color: colors.textOnNavy },
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily, fontSize: 11 },
        sceneStyle: { backgroundColor: colors.cream },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabHome'), tabBarIcon: icon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="courses"
        options={{ title: t('tabCourses'), tabBarIcon: icon('library-outline', 'library') }}
      />
      <Tabs.Screen
        name="learning"
        options={{ title: t('tabLearning'), tabBarIcon: icon('school-outline', 'school') }}
      />
      <Tabs.Screen
        name="sessions"
        options={{ title: t('tabSessions'), tabBarIcon: icon('calendar-outline', 'calendar') }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: t('tabAccount'), tabBarIcon: icon('person-outline', 'person') }}
      />
    </Tabs>
  );
}
