import { useState } from "react";
import type { Lang } from "../types";
import { getFortuneMessage } from "./messages";
export function Fortune({ emojis, lang }: { emojis: string[]; lang: Lang }) {
  const [message, setMessage] = useState("");
  const emoji = emojis[emojis.length - 1];
  return emoji ? (
    <div className="fortune">
      <button
        className="secondary"
        onClick={() => setMessage(getFortuneMessage(emoji, lang))}
      >
        🥠{" "}
        {lang === "nl" ? "Open een klein berichtje" : "Open a little message"}{" "}
        {emoji}
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  ) : null;
}
