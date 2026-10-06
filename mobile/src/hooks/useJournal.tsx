import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { ActivityIndicator, AppState, Pressable, Text } from 'react-native';
import { Screen } from '../components/Screen';
import { journal } from '../storage/journal';
import { DataError, emptyJournal, type Entry } from '../storage/model';
import { emptyDraft, localDate, type Draft } from '../storage/session';
import { colors, ui } from '../theme';
import { useI18n } from './useI18n';

type Journal = {
  drafts: Record<string, Draft>;
  entries: Record<string, Entry>;
  recent: string[];
  updateDraft: (date: string, draft: Draft) => void;
  remember: (id: string) => void;
  save: (date: string) => Promise<boolean>;
  saving: boolean;
  recentError: boolean;
};
const Context = createContext<Journal | null>(null);

export function JournalProvider({ children }: PropsWithChildren) {
  const { t } = useI18n();
  const [data, setData] = useState(emptyJournal);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'loadFailed' | 'dataCorrupt' | 'dataUnsupported'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [recentError, setRecentError] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    journal.load().then(result => {
      if (active) { setData(result); setStatus('ready'); }
    }).catch((error: unknown) => {
      if (active) setStatus(error instanceof DataError
        ? error.kind === 'unsupported' ? 'dataUnsupported' : 'dataCorrupt'
        : 'loadFailed');
    });
    return () => { active = false; };
  }, [attempt]);

  const entries = Object.fromEntries(Object.entries(data.entries).filter(([, entry]) => !entry.deletedAt));
  const updateDraft = (date: string, draft: Draft) => {
    if (busy.current || status !== 'ready') return;
    setDrafts(previous => ({ ...previous, [date]: draft }));
  };
  const remember = (id: string) => {
    if (busy.current || status !== 'ready') return;
    void journal.remember(id).then(result => {
      setData(result); setRecentError(false);
    }).catch(() => setRecentError(true));
  };
  const save = async (date: string) => {
    if (busy.current || status !== 'ready') return false;
    busy.current = true;
    setSaving(true);
    try {
      const result = await journal.save(date, drafts[date] ?? entries[date] ?? emptyDraft());
      setData(result);
      setRecentError(false);
      return true;
    } catch {
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  if (status !== 'ready') return (
    <Screen title={t('todayTitle')}>
      {status === 'loading' ? <ActivityIndicator color={colors.primary} /> : null}
      <Text accessibilityLiveRegion="polite" style={ui.body}>{t(status)}</Text>
      {status !== 'loading' && <Pressable accessibilityRole="button"
        onPress={() => { setStatus('loading'); setAttempt(value => value + 1); }} style={ui.card}>
        <Text style={ui.heading}>{t('retry')}</Text>
      </Pressable>}
    </Screen>
  );

  return (
    <Context.Provider value={{ drafts, entries, recent: data.recent, updateDraft, remember, save, saving, recentError }}>
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
