import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { useI18n } from '../hooks/useI18n';
import { colors, ui } from '../theme';

export default function SettingsScreen() {
  const { locale, setLocale, t } = useI18n();
  return (
    <Screen title={t('settingsTitle')}>
      <View style={ui.card}>
        <Text style={ui.heading}>{t('language')}</Text>
        <View style={styles.row}>
          {(['ko', 'en'] as const).map(value => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected: locale === value }}
              onPress={() => setLocale(value)}
              style={({ pressed }) => [
                styles.button,
                locale === value && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.label, locale === value && styles.selectedLabel]}>
                {t(value === 'ko' ? 'korean' : 'english')}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={ui.caption}>{t('languageHint')}</Text>
      </View>
      <View style={ui.card}>
        <Text style={ui.heading}>{t('privacyTitle')}</Text>
        <Text style={ui.body}>{t('privacyBody')}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  button: {
    minHeight: 48, minWidth: 96, padding: 14, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lavender,
  },
  selected: { backgroundColor: colors.primary },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  label: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  selectedLabel: { color: colors.surface },
});
