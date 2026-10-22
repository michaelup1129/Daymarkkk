export type PublicPost = {
  token: string;
  alias: string;
  emojis: string[];
  day: string;
  text: string | null;
  flagged: boolean;
  severity: string;
  mine: boolean;
};
// Explicit allowlist at the UI boundary, as well as in the SQL projection.
export function publicPost(value: Record<string, unknown>): PublicPost {
  if (
    typeof value.token !== "string" ||
    typeof value.alias !== "string" ||
    typeof value.day !== "string" ||
    !Array.isArray(value.emojis) ||
    !value.emojis.every((x) => typeof x === "string")
  )
    throw new Error("Invalid community response");
  const flagged = value.flagged === true;
  return {
    token: value.token,
    alias: value.alias,
    day: value.day,
    emojis: value.emojis as string[],
    text: flagged ? null : typeof value.text === "string" ? value.text : "",
    flagged,
    severity: typeof value.severity === "string" ? value.severity : "none",
    mine: value.mine === true,
  };
}
export type SiteSettings = {
  maintenance: boolean;
  posting_enabled: boolean;
  announcement: string;
};
