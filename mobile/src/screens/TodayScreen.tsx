import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/Screen';
import { EmojiPicker } from '../components/EmojiPicker';
import { emojiLabel, getEmoji } from '../data/emojis';
import { useI18n } from '../hooks/useI18n';
import { useJournal, useToday } from '../hooks/useJournal';
import { emptyDraft, localDate, noteLength, toEntry, type Draft } from '../storage/session';
import { colors, ui } from '../theme';

export default function TodayScreen() {
  const [date, setDate] = useState(() => localDate());
  useFocusEffect(useCallback(() => { setDate(localDate()); }, []));
  return <TodayForm key={date} date={date} />;
}

function TodayForm({ date }: { date: string }) {
  const { t, locale } = useI18n();
  const { drafts, entries, recent, updateDraft, remember, save, saving, recentError } = useJournal();
  const today = useToday();
  const entry = entries[date];
  const draft = drafts[date] ?? entry ?? emptyDraft();
  const [slot, setSlot] = useState<number | null>(null);
  const [notice, setNotice] = useState<'saved' | 'saveError' | null>(null);
  const length = noteLength(draft.note);
  const valid = toEntry(draft, date) !== null;
  const unchanged = !!entry && entry.note === draft.note && entry.emojis.every((id, i) => id === draft.emojis[i]);
  const disabled = !valid || unchanged || saving;
  const change = (next: Draft) => { updateDraft(date, next); setNotice(null); };
  const select = (id: string) => {
    if (slot === null) return;
    const next: Draft = { ...draft, emojis: [...draft.emojis] };
    next.emojis[slot] = id;
    change(next);
    remember(id);
    const empty = next.emojis.findIndex(value => value === null);
    setSlot(empty === -1 ? null : empty);
  };

  return (
    <Screen title={t('todayTitle')} subtitle={t('todayBody')}>
      <Text style={styles.date}>{date}</Text>
      <Text style={styles.preview}>{t('localOnly')}</Text>
      {date !== today && <Text style={ui.body}>{t('dayChanged')}</Text>}
      <View style={ui.card}>
        <Text style={ui.heading}>{t('pickTitle')}</Text>
        <Text style={ui.caption}>{t('pickHint')}</Text>
        <View style={styles.row}>
          {draft.emojis.map((id, index) => (
            <Pressable key={index} accessibilityRole="button" disabled={saving}
              accessibilityState={{ disabled: saving }}
              accessibilityLabel={`${t('slot')} ${index + 1}: ${emojiLabel(id, locale) || t('choose')}`}
              onPress={() => { Keyboard.dismiss(); setSlot(index); }}
              style={({ pressed }) => [styles.stamp,
                { backgroundColor: [colors.lavender, colors.peach, colors.yellow][index] },
                pressed && styles.pressed]}>
              <Text style={styles.emoji}>{getEmoji(id)?.symbol ?? '+'}</Text>
              <Text style={ui.caption}>{index + 1}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={ui.card}>
        <Text style={ui.heading}>{t('note')}</Text>
        <TextInput multiline editable={!saving} value={draft.note} onChangeText={note => change({ ...draft, note })}
          placeholder={t('notePlaceholder')} accessibilityLabel={t('note')}
          placeholderTextColor={colors.muted} textAlignVertical="top" style={styles.input} />
        <Text style={[ui.caption, length > 80 && styles.error]}>{length}/80</Text>
        {length > 80 && <Text accessibilityRole="alert" style={styles.error}>{t('tooLong')}</Text>}
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled, busy: saving }}
        disabled={disabled}
        onPress={async () => {
          Keyboard.dismiss();
          setNotice(null);
          setNotice(await save(date) ? 'saved' : 'saveError');
        }}
        style={({ pressed }) => [styles.save, disabled && styles.disabled, pressed && styles.pressed]}>
        <Text style={styles.saveText}>{t(saving ? 'saving' : entry ? 'update' : 'save')}</Text>
      </Pressable>
      {notice && <Text accessibilityLiveRegion="polite" style={ui.heading}>{t(notice)}</Text>}
      {!draft.emojis.every(Boolean) && <Text style={ui.caption}>{t('incomplete')}</Text>}
      {entry && !unchanged && <Text style={ui.caption}>{t('unsaved')}</Text>}
      {!unchanged && <Text style={ui.caption}>{t('draftHint')}</Text>}
      {recentError && <Text accessibilityLiveRegion="polite" style={styles.error}>{t('recentError')}</Text>}
      {entry && <View style={ui.card}>
        <Text style={ui.caption}>{t('savedPreview')}</Text>
        <Text style={styles.emoji}>{entry.emojis.map(id => getEmoji(id)?.symbol).join('  ')}</Text>
        {!!entry.note && <Text style={ui.body}>{entry.note}</Text>}
      </View>}
      <Text style={ui.caption}>{t('private')}</Text>
      {slot !== null && <EmojiPicker slot={slot} selected={draft.emojis[slot]} recent={recent}
        onSelect={select} onClose={() => setSlot(null)} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { color: colors.primary, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  preview: { color: colors.ink, backgroundColor: colors.yellow, borderRadius: 12, padding: 12, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10 },
  stamp: { flex: 1, minHeight: 104, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed',
    borderColor: colors.muted, alignItems: 'center', justifyContent: 'center', gap: 4 },
  emoji: { fontSize: 36, color: colors.primary },
  input: { minHeight: 100, fontSize: 16, lineHeight: 24, color: colors.ink, padding: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  error: { color: '#A12435', fontSize: 14 },
  save: { minHeight: 56, padding: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.primary },
  saveText: { color: colors.surface, fontSize: 17, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.8 },
});
