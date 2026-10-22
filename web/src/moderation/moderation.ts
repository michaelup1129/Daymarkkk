import { Profanity } from "@2toad/profanity";
const filter = new Profanity({ languages: ["en"], wholeWord: true });
export type Moderation = {
  flagged: boolean;
  reasons: string[];
  severity: "none" | "medium" | "high";
};
const hatePatterns = [
  /\b(?:kill|exterminate|deport)\s+(?:all\s+)?(?:jews|muslims|gays|immigrants|blacks)\b/i,
  /\b(?:white power|heil hitler)\b/i,
];
export function moderate(text: string): Moderation {
  const normalized = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(
      /[013457@$!]/g,
      (c) =>
        ({
          "0": "o",
          "1": "i",
          "3": "e",
          "4": "a",
          "5": "s",
          "7": "t",
          "@": "a",
          $: "s",
          "!": "i",
        })[c]!,
    );
  // Check both original word boundaries and basic punctuation/spacing evasion.
  const compact = normalized
    .replace(/(?<=[a-z])[.*_\-]+(?=[a-z])/g, "")
    .replace(/\b(?:[a-z]\s+){2,}[a-z]\b/g, (s) => s.replace(/\s/g, ""));
  const hate = hatePatterns.some((p) => p.test(normalized));
  const offensive =
    filter.exists(text) || filter.exists(normalized) || filter.exists(compact);
  const insult =
    /\b(?:you(?:'re| are)?\s+(?:a\s+)?(?:worthless|disgusting|idiot|moron)|go\s+kill\s+yourself)\b/i.test(
      normalized,
    );
  return {
    flagged: hate || offensive || insult,
    reasons: [
      ...(offensive ? ["offensive-language"] : []),
      ...(hate ? ["hateful-expression"] : []),
      ...(insult ? ["abusive-expression"] : []),
    ],
    severity: hate ? "high" : offensive || insult ? "medium" : "none",
  };
}
