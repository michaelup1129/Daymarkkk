import { useEffect, useState } from "react";
import { backend, rpc } from "../services/backend";
import { publicPost, type PublicPost } from "./model";
import { allEmojis } from "../data/emojis";
import type { Lang } from "../types";

function Post({
  post,
  lang,
  refresh,
}: {
  post: PublicPost;
  lang: Lang;
  refresh: () => void;
}) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function act(work: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage("");
    try {
      await work();
      setMessage(success);
    } catch {
      setMessage("This action could not be completed. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="card">
      <div className="eyebrow">
        {post.alias} · {post.day}
      </div>
      <div className="journal-emojis">{post.emojis.join(" ")}</div>
      {post.flagged && revealed === null ? (
        <div className="content-warning">
          <p>
            {lang === "nl"
              ? "Mogelijk kwetsende inhoud"
              : "Potentially offensive content"}
          </p>
          <div className="obscured" aria-hidden="true">
            •••• ••••• •••• ••••••
          </div>
          <button
            className="secondary"
            disabled={busy}
            onClick={() =>
              act(
                async () =>
                  setRevealed(
                    await rpc<string>("reveal_post", { p_token: post.token }),
                  ),
                "",
              )
            }
          >
            {lang === "nl" ? "Toon inhoud" : "Reveal content"}
          </button>
        </div>
      ) : (
        <p className="community-story">{revealed ?? post.text}</p>
      )}
      <div className="button-row">
        <button
          className="text-button"
          disabled={busy}
          onClick={() => {
            const reason = window.prompt(
              lang === "nl"
                ? "Waarom wil je dit melden?"
                : "Why are you reporting this post? (max 500 characters)",
            );
            if (reason?.trim())
              void act(
                () =>
                  rpc("report_post", {
                    p_token: post.token,
                    p_reason: reason.trim().slice(0, 500),
                  }),
                lang === "nl" ? "Melding ontvangen." : "Report received.",
              );
          }}
        >
          {lang === "nl" ? "Melden" : "Report"}
        </button>
        {post.mine && (
          <button
            className="danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Delete your shared post?"))
                void act(async () => {
                  await rpc("delete_own_post", { p_token: post.token });
                  refresh();
                }, "");
            }}
          >
            {lang === "nl" ? "Verwijderen" : "Delete"}
          </button>
        )}
      </div>
      {message && <p role="status">{message}</p>}
    </article>
  );
}
export function Community({ lang }: { lang: Lang }) {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  async function refresh() {
    try {
      const rows = await rpc<Record<string, unknown>[]>("community_feed");
      setPosts(rows.map(publicPost));
      setError("");
    } catch {
      setError("Community could not be loaded. Please retry.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function publish() {
    setBusy(true);
    setError("");
    try {
      const { data, error: failure } = await backend!.functions.invoke(
        "community-publish",
        { body: { emojis, text } },
      );
      if (failure || !data?.ok) throw new Error();
      setText("");
      setEmojis([]);
      await refresh();
    } catch {
      setError(
        "Could not share this moment. You may have posted in the last 24 hours, or posting may be paused. Your draft is still here.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="eyebrow">✦ THE SHARED UNIVERSE</div>
      <h1>
        {lang === "nl"
          ? "Een hemel vol verhalen"
          : "A universe of little stories"}
      </h1>
      <p className="lead">
        {lang === "nl"
          ? "Deel alleen wat je wilt. Je dagboek blijft privé."
          : "Share only what you choose. Your journal stays private."}
      </p>
      <div className="card">
        <h2>{lang === "nl" ? "Deel een moment" : "Share a little moment"}</h2>
        <p className="muted">
          {lang === "nl"
            ? "Eén bericht per 24 uur. Vermijd namen en contactgegevens."
            : "One post per 24 hours. Avoid names and contact details."}
        </p>
        <div className="community-slots">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              className="selected-slot"
              aria-label={`Remove emoji ${i + 1}`}
              onClick={() => setEmojis((x) => x.filter((_, j) => i !== j))}
            >
              {emojis[i] ?? "+"}
            </button>
          ))}
        </div>
        <div className="emoji-grid">
          {allEmojis.slice(0, 54).map((e) => (
            <button
              className="emoji-choice"
              key={e}
              disabled={emojis.length === 3}
              onClick={() => setEmojis((x) => (x.length < 3 ? [...x, e] : x))}
            >
              {e}
            </button>
          ))}
        </div>
        <label className="community-label" htmlFor="shared-text">
          {lang === "nl" ? "Je gedeelde verhaal" : "Your shared story"}
        </label>
        <textarea
          id="shared-text"
          className="community-textarea"
          maxLength={1000}
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <p className="muted">{text.length}/1000</p>
        <button
          className="primary"
          disabled={busy || emojis.length !== 3 || !text.trim()}
          onClick={publish}
        >
          {busy ? "…" : lang === "nl" ? "Anoniem delen" : "Share anonymously"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <button className="text-button" onClick={refresh}>
        {lang === "nl" ? "Vernieuwen" : "Refresh"}
      </button>
      {loading && <p role="status">Loading community…</p>}
      {!loading && !posts.length && !error && (
        <p className="empty">
          {lang === "nl"
            ? "De hemel wacht op een eerste ster."
            : "The sky is waiting for its first star."}
        </p>
      )}
      {posts.length > 0 && (
        <div className="community-sky" aria-hidden="true">
          {posts.slice(0, 20).map((p, i) => (
            <span
              className="community-star"
              key={p.token}
              style={{
                left: `${15 + ((i * 37) % 72)}%`,
                top: `${20 + ((i * 29) % 65)}%`,
              }}
            >
              ✦
            </span>
          ))}
        </div>
      )}
      {posts.map((p) => (
        <Post
          key={p.token}
          post={p}
          lang={lang}
          refresh={() => void refresh()}
        />
      ))}
    </>
  );
}
