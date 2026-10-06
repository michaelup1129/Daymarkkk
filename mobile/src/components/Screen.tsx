import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ui } from '../theme';

export function Screen({ title, subtitle, children }: PropsWithChildren<{
  title: string;
  subtitle?: string;
}>) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={styles.content}>
          <Text style={styles.brand}>daymark<Text style={styles.dot}> •</Text></Text>
          <Text accessibilityRole="header" style={ui.title}>{title}</Text>
          {subtitle ? <Text style={ui.body}>{subtitle}</Text> : null}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: 20 },
  brand: { fontSize: 22, fontWeight: '900', letterSpacing: -1, color: colors.ink },
  dot: { color: colors.primary },
});
