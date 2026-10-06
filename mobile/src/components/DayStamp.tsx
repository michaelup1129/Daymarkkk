import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../hooks/useI18n';
import { colors, ui } from '../theme';

const stamps = [
  { emoji: '☺️', color: colors.lavender, tilt: '-7deg' },
  { emoji: '☕', color: colors.peach, tilt: '4deg' },
  { emoji: '🌙', color: colors.yellow, tilt: '-3deg' },
] as const;

export function DayStamp() {
  const { t } = useI18n();
  return (
    <View style={ui.card}>
      <Text style={ui.caption}>{t('sample')}</Text>
      <View accessible accessibilityLabel={t('sampleLabel')} style={styles.row}>
        {stamps.map(stamp => (
          <View key={stamp.emoji} style={[
            styles.stamp,
            { backgroundColor: stamp.color, transform: [{ rotate: stamp.tilt }] },
          ]}>
            <Text style={styles.emoji}>{stamp.emoji}</Text>
          </View>
        ))}
      </View>
      <Text style={ui.heading}>{t('tagline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 24 },
  stamp: {
    flex: 1, minHeight: 88, borderRadius: 18, borderWidth: 1,
    borderStyle: 'dashed', borderColor: colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 36 },
});
