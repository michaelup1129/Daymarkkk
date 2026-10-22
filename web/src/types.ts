export type Lang = "en" | "nl";
export type Entry = {
  date: string;
  emojis: string[];
  note: string;
  createdAt: string;
  updatedAt: string;
};
export type Page =
  | "home"
  | "journal"
  | "calendar"
  | "sky"
  | "community"
  | "settings"
  | "edit"
  | "admin";
