import { useState, type SetStateAction } from "react";
import type { Entry } from "../types";
export function decodeEntries(raw: string | null): Entry[] {
  const data: unknown = raw === null ? [] : JSON.parse(raw);
  if (
    !Array.isArray(data) ||
    !data.every(
      (e) =>
        e &&
        typeof e.date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
        Number.isFinite(Date.parse(e.date)) &&
        Array.isArray(e.emojis) &&
        e.emojis.length === 3 &&
        e.emojis.every((v: unknown) => typeof v === "string") &&
        typeof e.note === "string" &&
        typeof e.createdAt === "string" &&
        typeof e.updatedAt === "string",
    )
  )
    throw new Error("Unreadable journal");
  return data;
}
export function useLocalJournal() {
  const [initial] = useState(() => {
    try {
      return {
        entries: decodeEntries(localStorage.getItem("daymark.entries")),
        error: "",
      };
    } catch {
      return {
        entries: [] as Entry[],
        error:
          "Your saved journal could not be read. The original data has been kept. Export the original browser data before repairing it.",
      };
    }
  });
  const [entries, update] = useState(initial.entries);
  const [storageError, setError] = useState(initial.error);
  function setEntries(action: SetStateAction<Entry[]>) {
    if (initial.error) return false;
    const next = typeof action === "function" ? action(entries) : action;
    try {
      localStorage.setItem("daymark.entries", JSON.stringify(next));
      update(next);
      setError("");
      return true;
    } catch {
      setError(
        "Saving failed. Your previous journal has been kept. Export your journal and check browser storage.",
      );
      return false;
    }
  }
  return { entries, setEntries, storageError };
}
