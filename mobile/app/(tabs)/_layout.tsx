import { Platform } from 'react-native';
import React from 'react';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../src/i18n';
import { colors, fonts, goldHairline } from '../../src/theme';
import { BrandHeader } from '../../src/ui/AppHeader';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** ارتفاع منطقة التبويب دون هامش النظام السفلي. */
const TAB_BAR_CONTENT_HEIGHT = 66;

export default function TabsLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  const icon =
    (name: IconName, active: IconName) =>
    ({ color, focused }: { color: ColorValue; size: number; focused: boolean }) => (
      <Ionicons name={focused ? active : name} size={21} color={color} />
    );

  return (
    <Tabs
      screenOptions={{
        /**
         * ترويسة الكلّية نفسها التي في `app/_layout.tsx`. هنا بلا عنوان
         * شاشة: شريط التبويبات أسفل الشاشة يقول أين نحن، فتكرارُه في
         * الرأس حشوٌ — والموقع نفسه لا يضع عنوان الصفحة في `.site-head`.
         */
        headerShown: true,
        header: () => <BrandHeader />,
        // شريط التبويبات بألوان الكلّية: قاعدةٌ كحليّة وذهبٌ للمُحدَّد.
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textOnNavyMuted,
        // الارتفاع الافتراضي لا يتّسع لسطرٍ عربيّ كامل، فتُقتصّ نواتئ
        // الحروف. نحسبه صراحةً ونضيف هامش النظام السفلي إليه.
        tabBarStyle: {
          backgroundColor: colors.navyDeep,
          borderTopColor: goldHairline,
          borderTopWidth: 1,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom + 4,
        },
        // `includeFontPadding` هنا أيضًا: تسميات التبويبات عربيّة، وبدونها
        // تُقتصّ أعالي الحروف على أندرويد كما في بقيّة النصوص.
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 10.5,
          lineHeight: 17,
          ...(Platform.OS === 'android' ? { includeFontPadding: true } : {}),
        },
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
