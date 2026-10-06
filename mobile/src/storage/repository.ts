import { getEmoji } from '../data/emojis';
import { decodeJournal, type JournalData } from './model';
import { isLocalDate, toEntry, type Draft } from './session';

export const JOURNAL_KEY = '@daymark/journal';
export type KeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};
type Environment = { id: () => string; now: () => Date; timeZone: () => string | null };

export class JournalRepository {
  private queue: Promise<void> = Promise.resolve();

  constructor(private storage: KeyValueStorage, private environment: Environment) {}

  // Read-modify-write operations share one queue so rapid changes cannot overwrite each other.
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work);
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }

  load(): Promise<JournalData> {
    return this.serial(async () => decodeJournal(await this.storage.getItem(JOURNAL_KEY)));
  }

  private mutate(change: (data: JournalData) => JournalData): Promise<JournalData> {
    return this.serial(async () => {
      // A failed or malformed read must never become a new empty journal.
      const current = decodeJournal(await this.storage.getItem(JOURNAL_KEY));
      const next = change(current);
      const raw = JSON.stringify(next);
      decodeJournal(raw);
      await this.storage.setItem(JOURNAL_KEY, raw);
      return next;
    });
  }

  save(date: string, draft: Draft): Promise<JournalData> {
    // Capture input before joining the queue; edits while waiting cannot alter this save.
    const content = toEntry(draft, date);
    if (!content) return Promise.reject(new Error('Invalid entry'));
    return this.mutate(current => {
      const previous = current.entries[date];
      const now = this.environment.now().toISOString();
      return {
        ...current,
        entries: {
          ...current.entries,
          [date]: {
            ...content,
            schemaVersion: 1,
            id: previous?.id ?? this.environment.id(),
            timeZone: previous ? previous.timeZone : this.environment.timeZone(),
            createdAt: previous?.createdAt ?? now,
            updatedAt: now,
            deletedAt: null,
          },
        },
        recent: [...new Set([...content.emojis.slice().reverse(), ...current.recent])].slice(0, 12),
      };
    });
  }

  remember(id: string): Promise<JournalData> {
    if (!getEmoji(id)) return Promise.reject(new Error('Unknown emoji'));
    return this.mutate(current => ({
      ...current,
      recent: [id, ...current.recent.filter(value => value !== id)].slice(0, 12),
    }));
  }

  remove(date: string): Promise<JournalData> {
    if (!isLocalDate(date)) return Promise.reject(new Error('Invalid date'));
    return this.mutate(current => {
      const entry = current.entries[date];
      if (!entry || entry.deletedAt) return current;
      const now = this.environment.now().toISOString();
      return { ...current, entries: { ...current.entries, [date]: { ...entry, updatedAt: now, deletedAt: now } } };
    });
  }
}
