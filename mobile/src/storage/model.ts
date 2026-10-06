import { getEmoji } from '../data/emojis';
import { isLocalDate, noteLength, type SessionEntry } from './session';

export type Entry = SessionEntry & {
  id: string;
  schemaVersion: 1;
  timeZone: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type JournalData = {
  schemaVersion: 1;
  entries: Record<string, Entry>;
  recent: string[];
};

export class DataError extends Error {
  constructor(public readonly kind: 'corrupt' | 'unsupported') {
    super(kind);
  }
}

export const emptyJournal = (): JournalData => ({ schemaVersion: 1, entries: {}, recent: [] });
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const timestamp = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isEntry(value: unknown): value is Entry {
  if (!object(value)) return false;
  return value.schemaVersion === 1 && typeof value.id === 'string' && uuid.test(value.id)
    && isLocalDate(value.localDate)
    && (value.timeZone === null || (typeof value.timeZone === 'string' && value.timeZone.length > 0))
    && timestamp(value.createdAt) && timestamp(value.updatedAt)
    && (value.deletedAt === null || timestamp(value.deletedAt))
    && typeof value.note === 'string' && noteLength(value.note) <= 80
    && Array.isArray(value.emojis) && value.emojis.length === 3
    && value.emojis.every(id => typeof id === 'string' && !!getEmoji(id));
}

// Migrations for future schema versions belong here. Never silently discard old data.
export function decodeJournal(raw: string | null): JournalData {
  if (raw === null) return emptyJournal();
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new DataError('corrupt'); }
  if (!object(value)) throw new DataError('corrupt');
  if (value.schemaVersion !== 1) throw new DataError('unsupported');
  if (!object(value.entries) || !Array.isArray(value.recent) || value.recent.length > 12
    || !value.recent.every(id => typeof id === 'string' && !!getEmoji(id))
    || new Set(value.recent).size !== value.recent.length) throw new DataError('corrupt');
  const entries: Record<string, Entry> = {};
  const ids = new Set<string>();
  for (const [date, entry] of Object.entries(value.entries)) {
    if (!isEntry(entry) || date !== entry.localDate || ids.has(entry.id)) throw new DataError('corrupt');
    entries[date] = entry;
    ids.add(entry.id);
  }
  return { schemaVersion: 1, entries, recent: value.recent as string[] };
}
