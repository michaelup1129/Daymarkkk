import type { Lang } from "./types";
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const monthKey = (d: string) => d.slice(0, 7);
export const format = (
  d: string,
  l: Lang,
  opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
) =>
  new Date(d + "T12:00:00").toLocaleDateString(
    l === "nl" ? "nl-NL" : "en-US",
    opts,
  );
export const seeded = (s: number) => {
  const x = Math.sin(s * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};
