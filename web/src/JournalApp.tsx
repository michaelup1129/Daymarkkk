import React, { useEffect, useState } from "react";
import {
  Home,
  BookHeart,
  CalendarDays,
  Stars,
  Settings,
  Globe2,
  Mic,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  Search,
  Check,
  Plus,
  SquarePen,
  Volume2,
  Shield,
} from "lucide-react";
import { emojiGroups, allEmojis } from "./data/emojis";
import { tr } from "./i18n";
import { today, format } from "./utils";
import type { Page, Lang } from "./types";
import { useLocalJournal } from "./storage/localJournal";
import { Community } from "./community/Community";
import { Constellation } from "./constellation/Constellation";
import { Fortune } from "./fortune/Fortune";
import { LegalFooter } from "./legal/Legal";
import { useAuth } from "./auth/Auth";
import { Admin } from "./admin/Admin";
import { SiteNotice } from "./components/SiteNotice";

export function JournalApp() {
  const { access, logout } = useAuth();
  const [lang, setLang] = useState<Lang>(() =>
    localStorage.getItem("daymark.lang") === "nl" ? "nl" : "en",
  );
  const t = tr[lang];
  const { entries, setEntries, storageError } = useLocalJournal();
  const [page, setPage] = useState<Page>("home");
  const [date, setDate] = useState(today());
  const [emojis, setEmojis] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("Feelings");
  const [search, setSearch] = useState("");
  const [viewMonth, setViewMonth] = useState(today().slice(0, 7));
  const [voice, setVoice] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [onboard, setOnboard] = useState(
    () => !localStorage.getItem("daymark.onboard"),
  );
  const [step, setStep] = useState(0);
  const [splash, setSplash] = useState(true);
  const recognitionRef = React.useRef<any>(null);
  useEffect(() => {
    let id = setTimeout(() => setSplash(false), 1500);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => {
    localStorage.setItem("daymark.lang", lang);
  }, [lang]);
  const notify = (s: string) => {
    setToast(s);
    setTimeout(() => setToast(""), 2600);
  };
  const openEdit = (d: string) => {
    const e = entries.find((x) => x.date === d);
    setDate(d);
    setEmojis(e?.emojis || []);
    setNote(e?.note || "");
    setVoice(false);
    setSuggestions([]);
    setPage("edit");
  };
  const save = () => {
    if (emojis.length !== 3) return;
    const now = new Date().toISOString();
    const saved = setEntries((prev) =>
      [
        ...prev.filter((x) => x.date !== date),
        {
          date,
          emojis,
          note,
          createdAt: prev.find((x) => x.date === date)?.createdAt || now,
          updatedAt: now,
        },
      ].sort((a, b) => b.date.localeCompare(a.date)),
    );
    if (saved) {
      notify(t.saved);
      setPage("home");
    }
  };
  const del = (d: string) => {
    if (window.confirm(t.confirm)) {
      if (setEntries((prev) => prev.filter((e) => e.date !== d)))
        setPage("journal");
    }
  };
  const startVoice = () => {
    const C =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!C) {
      notify(t.voiceUnavailable);
      return;
    }
    try {
      const r = new C();
      r.lang = lang === "nl" ? "nl-NL" : "en-US";
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (e: any) => {
        let words = "";
        for (let i = 0; i < e.results.length; i++)
          words += e.results[i][0].transcript + " ";
        setTranscript(words.trim());
      };
      r.onerror = () => {
        setListening(false);
        notify(t.voiceUnavailable);
      };
      r.onend = () => setListening(false);
      recognitionRef.current = r;
      r.start();
      setListening(true);
    } catch {
      notify(t.voiceUnavailable);
    }
  };
  const suggest = () => {
    const s = transcript.toLowerCase();
    const rules: [RegExp, string][] = [
      [/tired|exhaust|moe|slap|sleep|vermoeid|moeheid|피곤/, "😮‍💨"],
      [/exam|study|school|university|tentamen|stud|시험/, "📚"],
      [/coffee|koffie|latte|커피/, "☕"],
      [/friend|vriend|친구/, "🥰"],
      [/happy|great|joy|blij|leuk|gelukkig|행복/, "😊"],
      [/sad|cry|verdriet|huil|슬퍼/, "😢"],
      [/stress|anxious|druk|zenuw|스트레스/, "😰"],
      [/love|liefde|date|사랑/, "❤️"],
      [/sun|weather|zon|햇빛/, "☀️"],
      [/food|eat|dinner|eten|음식/, "🍜"],
      [/walk|nature|park|wandelen|산책/, "🌿"],
      [/party|celebrat|feest|파티/, "🥳"],
    ];
    const matched = rules.filter(([r]) => r.test(s)).map(([, e]) => e);
    setSuggestions([...new Set([...matched, "😌", "✨", "🌷"])].slice(0, 3));
  };
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "daymark-journal.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  const nav: [Page, any, string][] = [
    ["home", Home, t.home],
    ["journal", BookHeart, t.journal],
    ["calendar", CalendarDays, t.calendar],
    ["sky", Stars, t.sky],
    ["community", Globe2, lang === "nl" ? "Community" : "Community"],
    ["settings", Settings, t.settings],
  ];
  if (access.admin) nav.push(["admin", Shield, "Admin"]);
  const go = (p: Page) => {
    window.location.hash = "/" + p;
    setPage(p);
    setVoice(false);
  };
  useEffect(() => {
    const navigate = () => {
      const p = window.location.hash.slice(2) as Page;
      if (
        [
          "home",
          "journal",
          "calendar",
          "sky",
          "community",
          "settings",
          "admin",
        ].includes(p)
      )
        setPage(p);
    };
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  const shiftMonth = (n: number) => {
    const [y, m] = viewMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + n, 1);
    setViewMonth(
      d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"),
    );
  };
  useEffect(() => () => recognitionRef.current?.stop(), []);
  if (splash)
    return (
      <div className="splash">
        <div className="brand large">
          daymark <span>✧</span>
        </div>
        <p>{t.tag}</p>
      </div>
    );
  if (onboard)
    return (
      <div className="onboard">
        <div className="brand">daymark ✧</div>
        <div className="onboard-content">
          <div className="onboard-art">
            {["✧", "🥰 😊 🌷", "🎙️", "✦ · ✧ · ✦", "🌎"][step]}
          </div>
          <h1>
            {
              [
                t.welcome,
                "Three emojis. One day.",
                "Too tired to type?",
                "Your feelings become stars.",
                "Choose your language.",
              ][step]
            }
          </h1>
          <p>
            {
              [
                t.welcomeSub,
                t.pick,
                t.voiceHint,
                "Watch your little moments form a constellation of your month.",
                "English / Nederlands",
              ][step]
            }
          </p>
          {step === 4 && (
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              <option value="en">English</option>
              <option value="nl">Nederlands</option>
            </select>
          )}
        </div>
        <div className="onboard-actions">
          <button
            className="text-button"
            onClick={() => {
              setOnboard(false);
              localStorage.setItem("daymark.onboard", "1");
            }}
          >
            {t.skip}
          </button>
          <button
            className="primary"
            onClick={() => {
              if (step < 4) setStep(step + 1);
              else {
                setOnboard(false);
                localStorage.setItem("daymark.onboard", "1");
              }
            }}
          >
            {step === 4 ? t.begin : t.next} <ArrowRight size={17} />
          </button>
        </div>
      </div>
    );
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand" onClick={() => go("home")}>
          daymark <span>✧</span>
        </div>
        <div className="side-nav">
          {nav.map(([p, Icon, label]) => (
            <button
              key={p}
              className={page === p ? "nav active" : "nav"}
              onClick={() => go(p)}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          {t.tag}
          <br />
          <small>✧ made for little moments</small>
        </div>
      </aside>
      <main>
        <header>
          <div className="mobile-brand brand" onClick={() => go("home")}>
            daymark <span>✧</span>
          </div>
          <span className="date-label">
            {format(today(), lang, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
          <button
            className="icon-btn"
            aria-label={t.settings}
            onClick={() => go("settings")}
          >
            <Settings size={19} />
          </button>
        </header>
        <div className="content">
          <SiteNotice />
          {storageError && <p role="alert">{storageError}</p>}
          {page === "home" && (
            <>
              <div className="eyebrow">✦ YOUR PERSONAL SPACE</div>
              <h1>{t.greet}</h1>
              <p className="lead">{t.question}</p>
              <section className="hero">
                <div className="hero-stars">✳ ✧ ⋆</div>
                <div className="hero-emoji">🌷 ☁️ ✨</div>
                <h2>{t.sub}</h2>
                <div className="button-row">
                  <button className="primary" onClick={() => openEdit(today())}>
                    <Plus size={17} />
                    {t.choose}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => {
                      openEdit(today());
                      setVoice(true);
                    }}
                  >
                    <Mic size={17} />
                    {t.tell}
                  </button>
                </div>
              </section>
              <div className="section-head">
                <h2>{t.recent}</h2>
                <button className="text-button" onClick={() => go("journal")}>
                  {t.see} <ArrowRight size={15} />
                </button>
              </div>
              {entries.length ? (
                <div className="entries">
                  {entries.slice(0, 3).map((e) => (
                    <button
                      className="entry"
                      key={e.date}
                      onClick={() => openEdit(e.date)}
                    >
                      <div>
                        <span className="entry-date">
                          {format(e.date, lang)}
                        </span>
                        <p>{e.note || "A little moment remembered."}</p>
                      </div>
                      <span className="entry-emojis">{e.emojis.join(" ")}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="empty">{t.noentries}</div>
              )}
              <div className="section-head">
                <h2>{t.month}</h2>
              </div>
              <button className="preview" onClick={() => go("sky")}>
                <span className="preview-stars">✦ ⋆ · ✧ · ✦</span>
                <span>{t.explore} →</span>
              </button>
            </>
          )}
          {page === "edit" && (
            <>
              <button className="back" onClick={() => go("home")}>
                <ChevronLeft size={18} />
                {t.back}
              </button>
              <div className="eyebrow">{format(date, lang)}</div>
              <h1>{t.question}</h1>
              <p className="lead">{t.pick}</p>
              <div className="selected">
                {[0, 1, 2].map((i) => (
                  <button
                    aria-label={`Emoji ${i + 1}`}
                    key={i}
                    className="selected-slot"
                    onClick={() =>
                      setEmojis((x) => x.filter((_, j) => j !== i))
                    }
                  >
                    {emojis[i] || <Plus size={22} />}
                  </button>
                ))}
                <span className="counter">{emojis.length}/3</span>
              </div>
              <div className="card">
                <div className="category-row">
                  {Object.keys(emojiGroups).map((g) => (
                    <button
                      className={category === g ? "chip chosen" : "chip"}
                      key={g}
                      onClick={() => {
                        setCategory(g);
                        setSearch("");
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <label className="search">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t.search}
                  />
                </label>
                <div className="emoji-grid">
                  {(search ? allEmojis : emojiGroups[category])
                    .filter(
                      (e) =>
                        !search ||
                        e.includes(search) ||
                        Object.entries({
                          happy: "😊",
                          love: "❤️",
                          sad: "😢",
                          coffee: "☕",
                          sun: "☀️",
                          sleep: "😴",
                          flower: "🌷",
                          book: "📚",
                          heart: "🥰",
                        }).some(
                          ([k, v]) =>
                            k.includes(search.toLowerCase()) && v === e,
                        ),
                    )
                    .map((e, i) => (
                      <button
                        className="emoji-choice"
                        key={i}
                        onClick={() =>
                          setEmojis((prev) =>
                            prev.length < 3 ? [...prev, e] : prev,
                          )
                        }
                      >
                        {e}
                      </button>
                    ))}
                </div>
              </div>
              <div className="card voice-card">
                <div className="row-between">
                  <div>
                    <h3>
                      <Mic size={18} /> {t.tell}
                    </h3>
                    <p>{t.voiceHint}</p>
                  </div>
                  <button
                    className="circle-action"
                    onClick={() => setVoice(!voice)}
                  >
                    <Mic size={20} />
                  </button>
                </div>
                {voice && (
                  <div className="voice-body">
                    <button
                      className={listening ? "record recording" : "record"}
                      onClick={() => {
                        if (listening) recognitionRef.current?.stop();
                        else startVoice();
                      }}
                    >
                      {listening ? (
                        <>
                          <Volume2 size={20} />
                          {t.stop}
                        </>
                      ) : (
                        <>
                          <Mic size={20} />
                          {t.start}
                        </>
                      )}
                    </button>
                    <label>{t.transcript}</label>
                    <textarea
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={3}
                      placeholder={t.placeholder}
                    />
                    <button
                      className="secondary"
                      disabled={!transcript.trim()}
                      onClick={suggest}
                    >
                      {t.suggest}
                    </button>
                    {suggestions.length > 0 && (
                      <div className="suggestions">
                        <small>{t.demo}</small>
                        <p>{t.recommend}</p>
                        <div className="suggest-emoji">
                          {suggestions.join(" ")}
                        </div>
                        <button
                          className="primary"
                          onClick={() => {
                            setEmojis(suggestions);
                            setVoice(false);
                          }}
                        >
                          {t.accept}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Fortune key={emojis.join()} emojis={emojis} lang={lang} />
              <div className="note-section">
                <h2>{t.note}</h2>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.placeholder}
                  rows={4}
                />
              </div>
              <div className="button-row bottom-actions">
                <button
                  className="primary"
                  disabled={emojis.length !== 3}
                  onClick={save}
                >
                  <Check size={17} />
                  {t.save}
                </button>
                {entries.some((e) => e.date === date) && (
                  <button className="danger" onClick={() => del(date)}>
                    <Trash2 size={17} />
                    {t.delete}
                  </button>
                )}
              </div>
            </>
          )}
          {page === "journal" && (
            <>
              <div className="eyebrow">THE DAYS THAT MAKE YOU</div>
              <h1>{t.journal}</h1>
              <p className="lead">{t.monthTitle}</p>
              <div className="section-head">
                <h2>
                  {entries.length} {t.days}
                </h2>
                <button
                  className="primary small"
                  onClick={() => openEdit(today())}
                >
                  <Plus size={16} />
                  {t.today}
                </button>
              </div>
              {entries.length ? (
                <div className="entries">
                  {entries.map((e) => (
                    <div className="entry journal-entry" key={e.date}>
                      <div>
                        <span className="entry-date">
                          {format(e.date, lang)}
                        </span>
                        <div className="journal-emojis">
                          {e.emojis.join(" ")}
                        </div>
                        <p>{e.note}</p>
                      </div>
                      <div className="entry-actions">
                        <button
                          className="icon-btn"
                          onClick={() => openEdit(e.date)}
                          aria-label={t.edit}
                        >
                          <SquarePen size={17} />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => del(e.date)}
                          aria-label={t.delete}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  {t.noentries}
                  <br />
                  <button className="primary" onClick={() => openEdit(today())}>
                    {t.first}
                  </button>
                </div>
              )}
            </>
          )}
          {page === "calendar" && (
            <>
              <div className="eyebrow">YOUR DAYS, YOUR WAY</div>
              <h1>{t.calendar}</h1>
              <div className="calendar card">
                <div className="month-nav">
                  <button className="icon-btn" onClick={() => shiftMonth(-1)}>
                    <ChevronLeft />
                  </button>
                  <h2>
                    {format(viewMonth + "-01", lang, {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>
                  <button className="icon-btn" onClick={() => shiftMonth(1)}>
                    <ChevronRight />
                  </button>
                </div>
                <div className="cal-grid">
                  {Array.from({ length: 7 }, (_, i) => (
                    <span className="weekday" key={i}>
                      {new Intl.DateTimeFormat(
                        lang === "nl" ? "nl-NL" : "en-US",
                        { weekday: "short" },
                      ).format(new Date(2024, 0, i + 1))}
                    </span>
                  ))}
                  {Array.from(
                    {
                      length:
                        (new Date(
                          +viewMonth.slice(0, 4),
                          +viewMonth.slice(5) - 1,
                          1,
                        ).getDay() +
                          6) %
                        7,
                    },
                    (_, i) => (
                      <span key={"blank" + i} />
                    ),
                  )}
                  {Array.from(
                    {
                      length: new Date(
                        +viewMonth.slice(0, 4),
                        +viewMonth.slice(5),
                        0,
                      ).getDate(),
                    },
                    (_, i) => {
                      const d = `${viewMonth}-${String(i + 1).padStart(2, "0")}`;
                      const e = entries.find((x) => x.date === d);
                      return (
                        <button
                          key={d}
                          className={
                            "cal-day " +
                            (d === today() ? "today " : "") +
                            (e ? "has-entry" : "")
                          }
                          onClick={() => openEdit(d)}
                        >
                          <span>{i + 1}</span>
                          <small>{e?.emojis.join("") || ""}</small>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </>
          )}
          {page === "sky" && (
            <Constellation entries={entries} lang={lang} openEdit={openEdit} />
          )}
          {page === "community" && <Community lang={lang} />}
          {page === "admin" && <Admin />}
          {page === "settings" && (
            <>
              <button className="secondary" onClick={logout}>
                {lang === "nl" ? "Uitloggen" : "Sign out"}
              </button>
              <div className="eyebrow">MAKE IT YOURS</div>
              <h1>{t.settings}</h1>
              <div className="card settings-card">
                <h2>{t.language}</h2>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Lang)}
                >
                  <option value="en">English</option>
                  <option value="nl">Nederlands</option>
                </select>
                <h2>{t.theme}</h2>
                <p>{t.light} ☀️</p>
              </div>
              <div className="card settings-card">
                <h2>{t.privacy}</h2>
                <div className="premium-note">
                  <strong>Help improve Daymark ✧</strong>
                  <p>Trying our beta? We'd love your feedback.</p>
                  {import.meta.env.VITE_FEEDBACK_URL && (
                    <a
                      href={import.meta.env.VITE_FEEDBACK_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Give feedback ↗
                    </a>
                  )}
                  <p className="muted">
                    The feedback link must be configured by the team before
                    sharing this beta.
                  </p>
                </div>
                <p>{t.feedback}</p>
                <button className="secondary" onClick={downloadJSON}>
                  <Download size={17} />
                  {t.export}
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    if (window.confirm(t.confirmAll)) {
                      if (setEntries([])) notify("Data cleared");
                    }
                  }}
                >
                  <Trash2 size={17} />
                  {t.reset}
                </button>
              </div>
            </>
          )}
          <LegalFooter lang={lang} />
        </div>
      </main>
      <nav className="bottom-nav">
        {nav.map(([p, Icon, label]) => (
          <button
            key={p}
            className={page === p ? "active" : ""}
            onClick={() => go(p)}
          >
            <Icon size={21} />
            <small>{label}</small>
          </button>
        ))}
      </nav>
      {toast && <div className="toast">✧ {toast}</div>}
    </div>
  );
}
