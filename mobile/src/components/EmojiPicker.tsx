import { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categories, emojis, searchEmojis, getEmoji, type Category } from '../data/emojis';
import { useI18n } from '../hooks/useI18n';
import { colors, ui } from '../theme';

type Props = {
  slot: number;
  selected: string | null;
  recent: string[];
  onSelect: (id: string) => void;
  onClose: () => void;
};

export function EmojiPicker({ slot, selected, recent, onSelect, onClose }: Props) {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'all' | 'recent'>('all');
  const filtered = query.trim() ? searchEmojis(query)
    : category === 'recent' ? recent.flatMap(id => {
      const emoji = getEmoji(id);
      return emoji ? [emoji] : [];
    }) : emojis.filter(emoji => category === 'all' || emoji.category === category);

  return (
    <Modal visible animationType="none" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text accessibilityRole="header" style={ui.heading}>{t('choose')} · {slot + 1}/3</Text>
              <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
                <Text style={styles.accent}>{t('close')}</Text>
              </Pressable>
            </View>
            <TextInput
              value={query} onChangeText={setQuery}
              placeholder={t('search')} accessibilityLabel={t('search')}
              placeholderTextColor={colors.muted} style={styles.search}
              autoCapitalize="none" autoCorrect={false} returnKeyType="search"
            />
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.categories}>
                {(['all', 'recent', ...categories] as const).map(value => (
                  <Pressable key={value} accessibilityRole="button"
                    accessibilityState={{ selected: !query.trim() && category === value }}
                    onPress={() => { setCategory(value); setQuery(''); }}
                    style={[styles.chip, !query.trim() && category === value && styles.activeChip]}>
                    <Text style={{ color: !query.trim() && category === value ? colors.surface : colors.ink }}>
                      {t(value)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.grid}>
              {filtered.map(emoji => (
                <Pressable key={emoji.id} accessibilityRole="button" accessibilityLabel={emoji[locale]}
                  accessibilityState={{ selected: selected === emoji.id }}
                  onPress={() => { onSelect(emoji.id); setQuery(''); }}
                  style={({ pressed }) => [styles.emoji, selected === emoji.id && styles.chosen, pressed && styles.pressed]}>
                  <Text style={styles.symbol}>{emoji.symbol}</Text>
                  <Text numberOfLines={1} style={ui.caption}>{emoji[locale].split(' ')[0]}</Text>
                </Pressable>
              ))}
              {filtered.length === 0 && <Text style={ui.body}>
                {t(!query.trim() && category === 'recent' ? 'noRecent' : 'noResults')}
              </Text>}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' },
  close: { minHeight: 48, padding: 12, justifyContent: 'center' },
  accent: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  search: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16,
    backgroundColor: colors.surface, color: colors.ink, fontSize: 16 },
  categories: { gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 22, backgroundColor: colors.lavender },
  activeChip: { backgroundColor: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 24 },
  emoji: { width: '22%', minHeight: 88, padding: 6, gap: 4, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface },
  chosen: { borderColor: colors.primary, backgroundColor: colors.lavender },
  symbol: { fontSize: 32 },
  pressed: { transform: [{ scale: 0.95 }], opacity: 0.8 },
});
