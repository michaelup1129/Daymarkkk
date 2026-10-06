import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { I18nProvider, useI18n } from '../hooks/useI18n';
import { colors } from '../theme';
import { JournalProvider } from '../hooks/useJournal';

const routes = [
  { name: 'index', label: 'today', icon: '✦' },
  { name: 'calendar', label: 'calendar', icon: '▦' },
  { name: 'recap', label: 'recap', icon: '◷' },
  { name: 'settings', label: 'settings', icon: '⚙' },
] as const;

function Navigation() {
  const { t } = useI18n();
  return (
    <>
      <StatusBar style="dark" />
      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
      }}>
        {routes.map(route => (
          <Tabs.Screen key={route.name} name={route.name} options={{
            title: t(route.label),
            tabBarAccessibilityLabel: t(route.label),
            tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 24 }}>{route.icon}</Text>,
          }} />
        ))}
      </Tabs>
    </>
  );
}

export default function RootLayout() {
  return <I18nProvider><JournalProvider><Navigation /></JournalProvider></I18nProvider>;
}
