# Daymark 2단계 — 오늘 기록 전체 코드

현재 작업 폴더에는 아래 파일이 이미 반영되었습니다. 같은 폴더에서 실행한다면 코드를 다시 붙여넣을 필요 없이 실행 명령만 사용하세요.
다른 복사본에 적용할 때는 아래 순서대로 파일 전체를 저장하세요. 코드는 터미널이 아니라 VS Code의 해당 파일에 넣습니다.

## 1. 실행 중인 터미널에서 Ctrl+C

현재 Web Bundled 표시는 정상입니다. 서버를 중지한 뒤 설치합니다.

```bash
cd "/Users/michaellee/Documents/ChatGPT/데이마크/mobile"
npx expo install graphemer@1.4.0
```

1단계 프로젝트에 적용하는 증분 작업입니다. 새 프로젝트를 만들지 않습니다.
기존 .gitignore는 유지합니다. README는 기존 팀 문서를 보존하면서 현재 범위와 실행 순서를 병합합니다.
package-lock.json은 설치 명령이 생성·갱신하며 수동 작성하지 않습니다. 팀원은 변경된 lockfile을 받은 후 npm ci를 사용합니다.

## 2. 이번 단계의 파일 구조

```text
Daymarkkk/
├── README.md
├── docs/STEP-02.md
└── mobile/
    ├── package.json
    ├── package-lock.json
    └── src/
        ├── app/_layout.tsx
        ├── data/emojis.ts
        ├── storage/session.ts
        ├── hooks/useJournal.tsx
        ├── i18n/today.ts
        ├── i18n/messages.ts
        ├── components/EmojiPicker.tsx
        ├── components/Screen.tsx
        └── screens/TodayScreen.tsx
```

범위: 32개 자체 이모지, 최근 12개, 카테고리, 한영 검색, 메모, 메모리 저장·수정.
검색은 카테고리와 관계없이 전체 목록에서 수행합니다. 이모지 중복 선택을 허용합니다.
메모는 입력 중 80자를 넘길 수 있으나 초과 시 저장할 수 없습니다. 한글 조합과 복합 이모지 입력을 보존하기 위한 방식입니다.
기록·초안·최근 목록은 탭 이동 시 유지되며 앱 종료·새로고침 시 사라집니다.
날짜가 바뀐 상태에서 편집 중이면 원래 날짜에 저장됩니다. 오늘 탭에 다시 진입하면 새 날짜로 바뀝니다.

## 3. 파일별 전체 코드

### 1. mobile/package.json

```json
{
  "name": "daymark",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "dependencies": {
    "eslint": "^9.39.5",
    "eslint-config-expo": "~57.0.2",
    "expo": "~57.0.26",
    "expo-constants": "~57.0.20",
    "expo-linking": "~57.0.11",
    "expo-router": "~57.0.24",
    "expo-status-bar": "~57.0.1",
    "graphemer": "1.4.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-native": "0.86.3",
    "react-native-reanimated": "4.5.1",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.26.0",
    "react-native-web": "^0.21.2",
    "react-native-worklets": "0.10.1"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "typescript": "~6.0.3"
  },
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit",
    "lint": "expo lint"
  },
  "private": true
}
```

### 2. mobile/src/data/emojis.ts

```ts
import type { Locale } from '../i18n/messages';

export const categories = ['feeling', 'activity', 'food', 'nature'] as const;
export type Category = typeof categories[number];
export type Emoji = {
  id: string; symbol: string; category: Category; ko: string; en: string;
};

export const emojis: Emoji[] = [
  { id: 'smile', symbol: '😊', category: 'feeling', ko: '행복 미소 기쁨', en: 'happy smile joy' },
  { id: 'laugh', symbol: '😂', category: 'feeling', ko: '웃음 재미', en: 'laugh fun' },
  { id: 'love', symbol: '🥰', category: 'feeling', ko: '사랑 감사', en: 'love grateful' },
  { id: 'calm', symbol: '😌', category: 'feeling', ko: '평온 편안 휴식', en: 'calm relaxed' },
  { id: 'tired', symbol: '😴', category: 'feeling', ko: '피곤 잠 졸림', en: 'tired sleepy' },
  { id: 'sad', symbol: '😢', category: 'feeling', ko: '슬픔 눈물', en: 'sad crying' },
  { id: 'angry', symbol: '😤', category: 'feeling', ko: '화남 답답 스트레스', en: 'angry frustrated stress' },
  { id: 'party', symbol: '🥳', category: 'feeling', ko: '축하 파티 생일', en: 'party celebrate birthday' },
  { id: 'study', symbol: '📚', category: 'activity', ko: '공부 독서 책 학교', en: 'study books school' },
  { id: 'work', symbol: '💻', category: 'activity', ko: '일 업무 코딩', en: 'work coding laptop' },
  { id: 'run', symbol: '🏃', category: 'activity', ko: '달리기 운동', en: 'run exercise' },
  { id: 'music', symbol: '🎧', category: 'activity', ko: '음악 노래', en: 'music song' },
  { id: 'movie', symbol: '🎬', category: 'activity', ko: '영화 드라마', en: 'movie cinema drama' },
  { id: 'game', symbol: '🎮', category: 'activity', ko: '게임 놀이', en: 'game play' },
  { id: 'travel', symbol: '✈️', category: 'activity', ko: '여행 비행기', en: 'travel flight' },
  { id: 'home', symbol: '🏠', category: 'activity', ko: '집 가족', en: 'home family' },
  { id: 'coffee', symbol: '☕', category: 'food', ko: '커피 카페 차', en: 'coffee cafe tea' },
  { id: 'cake', symbol: '🍰', category: 'food', ko: '케이크 디저트', en: 'cake dessert' },
  { id: 'rice', symbol: '🍚', category: 'food', ko: '밥 식사', en: 'rice meal' },
  { id: 'noodle', symbol: '🍜', category: 'food', ko: '라면 국수', en: 'ramen noodle' },
  { id: 'pizza', symbol: '🍕', category: 'food', ko: '피자', en: 'pizza' },
  { id: 'salad', symbol: '🥗', category: 'food', ko: '샐러드 건강', en: 'salad healthy' },
  { id: 'beer', symbol: '🍺', category: 'food', ko: '맥주 술', en: 'beer drink' },
  { id: 'cook', symbol: '🍳', category: 'food', ko: '요리 아침', en: 'cooking breakfast' },
  { id: 'sun', symbol: '☀️', category: 'nature', ko: '해 맑음 햇살', en: 'sun sunny' },
  { id: 'rain', symbol: '🌧️', category: 'nature', ko: '비 흐림', en: 'rain cloudy' },
  { id: 'moon', symbol: '🌙', category: 'nature', ko: '달 밤', en: 'moon night' },
  { id: 'flower', symbol: '🌸', category: 'nature', ko: '꽃 봄', en: 'flower spring' },
  { id: 'tree', symbol: '🌳', category: 'nature', ko: '나무 산책 공원', en: 'tree walk park' },
  { id: 'sea', symbol: '🌊', category: 'nature', ko: '바다 파도', en: 'sea ocean wave' },
  { id: 'cat', symbol: '🐱', category: 'nature', ko: '고양이', en: 'cat' },
  { id: 'dog', symbol: '🐶', category: 'nature', ko: '강아지 개', en: 'dog puppy' },
];

export function getEmoji(id: string | null) {
  return emojis.find(emoji => emoji.id === id);
}

export function emojiLabel(id: string | null, locale: Locale) {
  return getEmoji(id)?.[locale] ?? '';
}

export function searchEmojis(query: string) {
  const words = query.normalize('NFKC').toLowerCase().trim().split(/\s+/);
  return emojis.filter(emoji => words.every(word =>
    `${emoji.symbol} ${emoji.ko} ${emoji.en}`.normalize('NFKC').toLowerCase().includes(word),
  ));
}
```

### 3. mobile/src/storage/session.ts

```ts
import Graphemer from 'graphemer';
import { getEmoji } from '../data/emojis';

export type Draft = { emojis: [string | null, string | null, string | null]; note: string };
export type SessionEntry = { emojis: [string, string, string]; note: string; localDate: string };
const splitter = new Graphemer();
export const emptyDraft = (): Draft => ({ emojis: [null, null, null], note: '' });
export const noteLength = (note: string) => splitter.countGraphemes(note);

export function localDate(now = new Date()) {
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')].join('-');
}

export function toEntry(draft: Draft, date: string): SessionEntry | null {
  const [a, b, c] = draft.emojis;
  if (!a || !b || !c || ![a, b, c].every(id => getEmoji(id)) || noteLength(draft.note) > 80) {
    return null;
  }
  return { emojis: [a, b, c], note: draft.note, localDate: date };
}
```

### 4. mobile/src/hooks/useJournal.tsx

```tsx
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { emptyDraft, localDate, toEntry, type Draft, type SessionEntry } from '../storage/session';

type Journal = {
  drafts: Record<string, Draft>;
  entries: Record<string, SessionEntry>;
  recent: string[];
  updateDraft: (date: string, draft: Draft) => void;
  remember: (id: string) => void;
  save: (date: string) => boolean;
};
const Context = createContext<Journal | null>(null);

export function JournalProvider({ children }: PropsWithChildren) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [entries, setEntries] = useState<Record<string, SessionEntry>>({});
  const [recent, setRecent] = useState<string[]>([]);
  const updateDraft = (date: string, draft: Draft) => {
    setDrafts(previous => ({ ...previous, [date]: draft }));
  };
  const remember = (id: string) => setRecent(previous => [id, ...previous.filter(x => x !== id)].slice(0, 12));
  const save = (date: string) => {
    const entry = toEntry(drafts[date] ?? emptyDraft(), date);
    if (!entry) return false;
    setEntries(previous => ({ ...previous, [date]: entry }));
    return true;
  };
  return (
    <Context.Provider value={{ drafts, entries, recent, updateDraft, remember, save }}>
      {children}
    </Context.Provider>
  );
}

export function useJournal() {
  const context = useContext(Context);
  if (!context) throw new Error('useJournal requires JournalProvider');
  return context;
}

export function useToday() {
  const [today, setToday] = useState(() => localDate());
  useEffect(() => {
    const refresh = () => setToday(localDate());
    const timer = setInterval(refresh, 15000);
    const listener = AppState.addEventListener('change', refresh);
    return () => { clearInterval(timer); listener.remove(); };
  }, []);
  return today;
}
```

### 5. mobile/src/i18n/today.ts

```ts
export const todayKo = {
  pickTitle: '오늘의 이모지', pickHint: '빈 우표를 눌러 세 개를 골라주세요. 같은 이모지도 괜찮아요.',
  slot: '이모지 칸', choose: '이모지 선택', close: '닫기',
  search: '한글 또는 영어로 검색', all: '전체', recent: '최근',
  feeling: '기분', activity: '활동', food: '음식', nature: '자연',
  noResults: '일치하는 이모지가 없어요. 다른 단어로 검색해 보세요.',
  noRecent: '아직 고른 이모지가 없어요. 전체에서 먼저 골라보세요.',
  note: '짧은 메모 · 선택', notePlaceholder: '기억하고 싶은 한 장면이 있나요?',
  tooLong: '메모를 80자 이내로 줄여주세요.',
  save: '오늘 남기기', update: '수정 내용 저장', saved: '오늘을 붙여두었어요!',
  incomplete: '이모지 세 개를 고르면 저장할 수 있어요.',
  saveError: '이모지 세 개와 메모 길이를 확인해 주세요.',
  sessionOnly: '체험 중: 기록과 최근 이모지는 앱 종료 또는 새로고침 시 사라져요.',
  savedPreview: '저장한 하루', unsaved: '아직 저장하지 않은 변경이 있어요.',
  dayChanged: '날짜가 바뀌었어요. 입력 중이던 날짜에 저장되며, 다시 오늘 탭을 열면 새 하루가 시작돼요.',
};

export const todayEn: Record<keyof typeof todayKo, string> = {
  pickTitle: 'Today’s emoji', pickHint: 'Tap a blank stamp and choose three. Repeating an emoji is welcome.',
  slot: 'Emoji slot', choose: 'Choose an emoji', close: 'Close',
  search: 'Search in Korean or English', all: 'All', recent: 'Recent',
  feeling: 'Feelings', activity: 'Activities', food: 'Food', nature: 'Nature',
  noResults: 'No matching emoji. Try another word.',
  noRecent: 'No recent emoji yet. Choose one from All first.',
  note: 'A little note · optional', notePlaceholder: 'A moment you want to remember?',
  tooLong: 'Please keep your note within 80 characters.',
  save: 'Keep today', update: 'Save changes', saved: 'Your day is stamped!',
  incomplete: 'Choose three emoji to save your day.',
  saveError: 'Check that you have three emoji and a note within the limit.',
  sessionOnly: 'Preview: entries and recent emoji disappear when the app closes or reloads.',
  savedPreview: 'Your saved day', unsaved: 'You have unsaved changes.',
  dayChanged: 'The date changed. This draft saves to its original date. Reopen Today to start a new day.',
};
```

### 6. mobile/src/i18n/messages.ts

```ts
import { todayKo, todayEn } from './today';

export const ko = {
  ...todayKo,
  today: '오늘', calendar: '달력', recap: '리캡', settings: '설정',
  tagline: '세 개의 이모지, 하나의 하루.',
  todayTitle: '오늘을 붙여두세요',
  todayBody: '길게 쓰지 않아도 괜찮아요. 기억하고 싶은 순간 세 개면 충분해요.',
  sample: '하루 우표 예시',
  sampleLabel: '미소, 커피, 달 이모지로 만든 하루 우표',
  private: '기록은 기본적으로 나만 볼 수 있어요.',
  next: '다음 단계에서 이모지 선택과 기록하기가 열려요.',
  calendarTitle: '하루가 모이는 곳',
  calendarBody: '4단계에서 월간 달력과 날짜별 기록을 연결해요.',
  recapTitle: '나의 작은 패턴',
  recapBody: '5단계에서 주간·월간 이모지와 연속 기록을 확인해요.',
  settingsTitle: '나에게 맞게',
  language: '앱 언어', korean: '한국어', english: 'English',
  languageHint: '지금은 앱을 다시 시작하면 한국어로 돌아와요. 언어 저장은 6단계에서 연결해요.',
  privacyTitle: '나만의 기록부터',
  privacyBody: '공유는 내가 고른 기록만, 직접 실행할 때 이루어지도록 만들어요.',
};

export type MessageKey = keyof typeof ko;
export type Locale = 'ko' | 'en';

const en: Record<MessageKey, string> = {
  ...todayEn,
  today: 'Today', calendar: 'Calendar', recap: 'Recap', settings: 'Settings',
  tagline: 'Three emoji. One little day.',
  todayTitle: 'Give today a place',
  todayBody: 'No long diary needed. Three moments worth keeping are enough.',
  sample: 'A sample day stamp',
  sampleLabel: 'A day stamp with a smile, coffee, and moon emoji',
  private: 'Your entries are private by default.',
  next: 'Emoji selection and journaling arrive in the next step.',
  calendarTitle: 'Days, collected',
  calendarBody: 'Step 4 connects the monthly calendar and entries by date.',
  recapTitle: 'Your little patterns',
  recapBody: 'Step 5 brings weekly and monthly emoji recaps and your streak.',
  settingsTitle: 'Make it yours',
  language: 'App language', korean: '한국어', english: 'English',
  languageHint: 'Restarting currently resets to Korean. Language persistence arrives in step 6.',
  privacyTitle: 'Start with a private space',
  privacyBody: 'Sharing will only happen when you choose an entry and explicitly share it.',
};

export const messages: Record<Locale, Record<MessageKey, string>> = { ko, en };
```

### 7. mobile/src/components/EmojiPicker.tsx

```tsx
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
```

### 8. mobile/src/components/Screen.tsx

```tsx
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
```

### 9. mobile/src/screens/TodayScreen.tsx

```tsx
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
  const { drafts, entries, recent, updateDraft, remember, save } = useJournal();
  const today = useToday();
  const draft = drafts[date] ?? emptyDraft();
  const entry = entries[date];
  const [slot, setSlot] = useState<number | null>(null);
  const [notice, setNotice] = useState<'saved' | 'saveError' | null>(null);
  const length = noteLength(draft.note);
  const valid = toEntry(draft, date) !== null;
  const unchanged = !!entry && entry.note === draft.note && entry.emojis.every((id, i) => id === draft.emojis[i]);
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
      <Text style={styles.preview}>{t('sessionOnly')}</Text>
      {date !== today && <Text style={ui.body}>{t('dayChanged')}</Text>}
      <View style={ui.card}>
        <Text style={ui.heading}>{t('pickTitle')}</Text>
        <Text style={ui.caption}>{t('pickHint')}</Text>
        <View style={styles.row}>
          {draft.emojis.map((id, index) => (
            <Pressable key={index} accessibilityRole="button"
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
        <TextInput multiline value={draft.note} onChangeText={note => change({ ...draft, note })}
          placeholder={t('notePlaceholder')} accessibilityLabel={t('note')}
          placeholderTextColor={colors.muted} textAlignVertical="top" style={styles.input} />
        <Text style={[ui.caption, length > 80 && styles.error]}>{length}/80</Text>
        {length > 80 && <Text accessibilityRole="alert" style={styles.error}>{t('tooLong')}</Text>}
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid || unchanged }}
        disabled={!valid || unchanged}
        onPress={() => { Keyboard.dismiss(); setNotice(save(date) ? 'saved' : 'saveError'); }}
        style={({ pressed }) => [styles.save, (!valid || unchanged) && styles.disabled, pressed && styles.pressed]}>
        <Text style={styles.saveText}>{t(entry ? 'update' : 'save')}</Text>
      </Pressable>
      {notice && <Text accessibilityLiveRegion="polite" style={ui.heading}>{t(notice)}</Text>}
      {!draft.emojis.every(Boolean) && <Text style={ui.caption}>{t('incomplete')}</Text>}
      {entry && !unchanged && <Text style={ui.caption}>{t('unsaved')}</Text>}
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
```

### 10. mobile/src/app/_layout.tsx

```tsx
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
```

### 11. README.md

````markdown
# Daymark

이모지 세 개로 하루를 남기는 iOS/Android 다이어리입니다.
웹은 개발 미리보기 용도로만 사용합니다.

## 시작하기

Node 24 LTS와 npm을 사용합니다. 앱 코드는 mobile/에 있습니다.

```sh
cd mobile
npm ci
npm start
```

터미널 QR을 SDK 57 호환 Expo Go로 열거나 개발 빌드를 사용합니다.
웹 미리보기는 `npm run web`으로 실행합니다.
포트가 비어 있으면 기본 주소는 http://localhost:8081 입니다.

## 검증

```sh
npm run typecheck
npm run lint
npx expo-doctor
npx expo export --platform all
```

## 현재 범위

2단계: 테마, 네 개의 하단 탭, 한국어/영어 전환, 자체 이모지 선택기,
최근 사용·카테고리·한영 검색, 80자 메모, 기록 저장·수정.
기록·초안·최근 이모지·언어 선택은 현재 메모리에만 유지됩니다.
앱 종료 또는 새로고침 시 사라집니다. 달력 데이터, 리캡, 알림, 공유는 아직 구현하지 않았습니다.
2단계 전체 코드와 실행 순서는 docs/STEP-02.md에 있습니다.

## 다음 단계

3. 데이터 모델과 영구 로컬 저장소
4. 월간 달력
5. 주간/월간 리캡과 스트릭
6. 알림과 설정 저장
7. 규칙 기반 조합 문구, 선택적 AI 확장
8. 이미지 공유와 배포

## 협업

- main 직접 푸시 금지. PR 한 건에 기능 하나.
- 브랜치: feature/setup, feature/home, feature/calendar, feature/recap.
- 커밋: feat:, fix:, docs:, chore: 접두사 사용.
- PR에 변경 요약, iOS/Android 확인 결과, 화면 캡처를 포함합니다.
- 최소 한 명 승인 후 squash merge 합니다.
- GitHub main 보호 규칙에서 PR과 승인 1개를 필수로 설정합니다.
- package-lock.json을 커밋하고 팀원은 npm ci를 사용합니다.
- 공통 테마/번역/의존성 수정은 PR에 명시합니다.

## 폴더 담당

- src/app: 경로와 네비게이션
- src/screens: 기능별 화면
- src/components: 공통 UI
- src/hooks: 상태와 화면 연결
- src/storage: 로컬 저장 및 향후 동기화 경계
- src/ai: 규칙 기반 요약 및 선택적 AI 연동
- src/theme: 색상과 공통 스타일
- src/i18n: 한국어/영어 문구

## 데이터와 프라이버시 원칙

기록은 기기 현지 날짜당 하나, 이모지 정확히 3개, 선택 메모 최대 80자입니다.
초기 버전은 로컬 저장을 사용합니다. 앱 삭제 시 기록을 잃을 수 있으므로
가족 배포 전 내보내기/복원 기능을 마련합니다.
로컬 저장이 암호화 보관을 의미하지는 않습니다.
공유는 사용자가 실행한 이미지 공유만 지원하며 메모 포함 기본값은 끕니다.
AI API 키를 앱이나 EXPO_PUBLIC 환경 변수에 넣지 않습니다.

## 배포 방향

개발: Expo Go 또는 development build.
가족 테스트: Android APK, iOS TestFlight.
iOS TestFlight 배포에는 Apple Developer 계정이 필요합니다.
알림과 공유는 웹이 아닌 실제 iOS/Android 기기에서 검증합니다.
````

## 4. 저장 후 실행

```bash
npm run typecheck
npm run lint
npx expo start --web --clear
```

브라우저는 터미널에 표시된 주소를 사용합니다. 기본값은 http://localhost:8081 입니다.

## 5. 확인 순서

1. 오늘 탭의 첫 이모지 칸을 누르고 최근 목록이 빈 상태인지 확인합니다.
2. 전체 또는 카테고리에서 선택하고, coffee와 커피 검색이 모두 되는지 확인합니다.
3. 세 번째 이모지까지 고르면 창이 닫히고 저장 버튼이 활성화되는지 확인합니다.
4. 메모 없이 저장하고, 메모를 추가해 수정 저장합니다.
5. 메모 80자는 저장되고 81자는 저장이 막히는지 확인합니다. 가족 이모지 👨‍👩‍👧‍👦는 한 글자로 계산됩니다.
6. 설정에서 영어로 바꾸고 오늘 탭으로 돌아와 문구와 기록을 확인합니다.
7. 최근 목록에 중복 항목이 없는지 확인합니다. 동일 이모지를 세 칸에 고르는 것은 허용됩니다.
8. 새로고침하면 기록이 사라집니다. 이 단계의 메모리 저장 방식에 따른 동작입니다.
9. 휴대폰에서 검색/메모 키보드와 Android 뒤로가기로 선택창 닫기를 확인합니다.

검증 완료: TypeScript, ESLint, iOS/Android/web 번들 생성, Unicode·입력 검증·검색·현지 날짜 23개 assertion.
직접 UI 클릭과 실제 기기 확인은 아직 수행하지 못했습니다.

이 단계에서 실행해서 확인할 것: npm run web에서 이모지 3개 선택 → 메모 → 저장 → 수정 → 언어 전환을 확인합니다.
커밋 메시지 예시: feat: add emoji picker and session journal

다음 3단계에서 앱을 다시 열어도 기록이 남도록 영구 저장소를 연결합니다.
