import type { Lang } from "../types";
const groups = {
  comfort: ["😭", "😢", "🥲", "💔"],
  encourage: ["😔", "🥹"],
  love: ["🥰", "❤️", "🤍", "💗", "🫶", "😍"],
  joy: ["😂", "😄", "😊", "🥳", "🤩"],
  ground: ["😡", "😤"],
  reassure: ["😰", "😨", "😵‍💫"],
  rest: ["😴", "😮‍💨", "🛏️"],
};
type Mood = keyof typeof groups | "general";
export function classifyEmoji(emoji: string): Mood {
  return (
    (Object.entries(groups).find(([, values]) =>
      values.includes(emoji),
    )?.[0] as Mood) ?? "general"
  );
}
const messages: Record<Lang, Record<Mood, string[]>> = {
  en: {
    comfort: [
      "You do not have to make today feel different. A little kindness toward yourself is enough.",
      "Some days ask for gentleness. You deserve a little of it too.",
    ],
    encourage: [
      "One small step still counts. You can take your time.",
      "You do not need every answer today. There is room to begin again.",
    ],
    love: [
      "Let this warm little moment stay with you.",
      "The care you notice is worth keeping.",
    ],
    joy: [
      "Keep a little of this laughter for later.",
      "Small joys deserve a place in your story.",
    ],
    ground: [
      "You can pause before deciding what comes next.",
      "Give yourself a little space. This moment does not have to set the pace of your day.",
    ],
    reassure: [
      "You can take things one moment at a time.",
      "You do not have to carry the whole day at once.",
    ],
    rest: [
      "Rest is allowed, even when the list is unfinished.",
      "A slower moment can be a kind gift to yourself.",
    ],
    general: [
      "A little moment is still worth remembering.",
      "Your day does not need to be extraordinary to matter.",
    ],
  },
  nl: {
    comfort: [
      "Vandaag hoeft niet anders te voelen. Een beetje zachtheid voor jezelf is genoeg.",
      "Sommige dagen vragen om mildheid. Ook jij verdient die.",
    ],
    encourage: [
      "Een klein stapje telt ook. Neem de tijd.",
      "Je hoeft vandaag niet alle antwoorden te hebben.",
    ],
    love: [
      "Bewaar dit warme momentje bij je.",
      "De liefde die je opmerkt, is het bewaren waard.",
    ],
    joy: [
      "Bewaar een beetje van deze lach voor later.",
      "Kleine vreugdes verdienen een plek in je verhaal.",
    ],
    ground: [
      "Je mag even pauzeren voor je verdergaat.",
      "Geef jezelf wat ruimte. Dit moment hoeft niet je hele dag te bepalen.",
    ],
    reassure: [
      "Je mag het moment voor moment bekijken.",
      "Je hoeft niet de hele dag tegelijk te dragen.",
    ],
    rest: [
      "Je mag rusten, ook als niet alles af is.",
      "Een rustig moment kan een vriendelijk cadeau zijn.",
    ],
    general: [
      "Ook een klein moment is het herinneren waard.",
      "Je dag hoeft niet bijzonder te zijn om ertoe te doen.",
    ],
  },
};
export function getFortuneMessage(
  emoji: string,
  lang: Lang = "en",
  random = Math.random,
) {
  const pool = messages[lang][classifyEmoji(emoji)];
  return pool[
    Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))
  ];
}
