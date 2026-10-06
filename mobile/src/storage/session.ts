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
  if (!isLocalDate(date) || !a || !b || !c || ![a, b, c].every(id => getEmoji(id)) || noteLength(draft.note) > 80) {
    return null;
  }
  return { emojis: [a, b, c], note: draft.note, localDate: date };
}

export function isLocalDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
