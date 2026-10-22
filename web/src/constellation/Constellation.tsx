import { constellationPoints } from "./layout";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Stars, Download } from "lucide-react";
import { tr } from "../i18n";
import { today, monthKey, format, seeded } from "../utils";
import type { Entry, Lang } from "../types";
export function Constellation({
  entries,
  lang,
  openEdit,
}: {
  entries: Entry[];
  lang: Lang;
  openEdit: (date: string) => void;
}) {
  const t = tr[lang];
  const [viewMonth, setViewMonth] = useState(today().slice(0, 7));
  const [showSample, setShowSample] = useState(false);
  const [starName, setStarName] = useState("The Little Moments");
  const [activeStar, setActiveStar] = useState<string | null>(null);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    entries
      .filter((e) => monthKey(e.date) === viewMonth)
      .forEach((e) => e.emojis.forEach((x) => (c[x] = (c[x] || 0) + 1)));
    return Object.entries(c).sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [entries, viewMonth]);
  const monthEntries = entries.filter((e) => monthKey(e.date) === viewMonth);
  const sampleCounts: [string, number][] = [
    ["☀️", 12],
    ["🥰", 9],
    ["☕", 7],
    ["🌷", 6],
    ["✨", 5],
    ["😴", 4],
    ["📚", 3],
    ["🌙", 2],
  ];
  const skyData = counts.length ? counts : showSample ? sampleCounts : [];
  const points = constellationPoints(skyData);
  const shiftMonth = (n: number) => {
    const [y, m] = viewMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + n, 1);
    setViewMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
    setShowSample(false);
    setActiveStar(null);
  };
  const downloadSky = () => {
    const svg = document.querySelector("#sky-svg") as SVGSVGElement | null;
    if (!svg) return;
    const copy = svg.cloneNode(true) as SVGSVGElement;
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    copy.setAttribute("width", "1080");
    copy.setAttribute("height", "1350");
    copy.setAttribute("viewBox", "0 0 100 125");
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", "100");
    bg.setAttribute("height", "125");
    bg.setAttribute("fill", "#101722");
    copy.insertBefore(bg, copy.firstChild);
    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", "50");
    txt.setAttribute("y", "112");
    txt.setAttribute("text-anchor", "middle");
    txt.setAttribute("font-size", "3");
    txt.setAttribute("fill", "#e9d5a5");
    txt.textContent = `daymark · ${viewMonth} · ${starName}`;
    copy.appendChild(txt);
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(copy)], {
        type: "image/svg+xml",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `daymark-${viewMonth}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <div className="eyebrow">A SKY THAT IS YOURS</div>
      <h1>{t.monthTitle}</h1>
      <div className="month-nav sky-month">
        <button className="icon-btn" onClick={() => shiftMonth(-1)}>
          <ChevronLeft />
        </button>
        <h2>
          {format(viewMonth + "-01", lang, { month: "long", year: "numeric" })}
        </h2>
        <button className="icon-btn" onClick={() => shiftMonth(1)}>
          <ChevronRight />
        </button>
      </div>
      {skyData.length ? (
        <>
          <div className="sky-wrap">
            <div className="sky-header">
              <span>✧ daymark</span>
              <strong>{starName}</strong>
              <small>
                {format(viewMonth + "-01", lang, {
                  month: "long",
                  year: "numeric",
                })}
              </small>
            </div>
            <svg
              id="sky-svg"
              viewBox="0 0 100 100"
              role="img"
              aria-label="Personal emoji constellation"
            >
              <defs>
                <radialGradient id="glow">
                  <stop stopColor="#fff" />
                  <stop offset=".25" stopColor="#f5e5b9" />
                  <stop offset="1" stopColor="#e9d5a5" stopOpacity="0" />
                </radialGradient>
              </defs>
              {Array.from({ length: 95 }, (_, i) => (
                <circle
                  key={i}
                  cx={seeded(i + 22) * 100}
                  cy={seeded(i + 310) * 100}
                  r={0.07 + seeded(i + 61) * 0.17}
                  fill="#dce2ef"
                  opacity={0.15 + seeded(i + 33) * 0.6}
                />
              ))}
              {points.slice(1).map((p, i) => {
                const prev = points[i];
                return (
                  <line
                    key={i}
                    x1={prev.x}
                    y1={prev.y}
                    x2={p.x}
                    y2={p.y}
                    stroke="#e9d5a5"
                    strokeWidth=".15"
                    opacity=".5"
                  />
                );
              })}
              {points.map((p) => (
                <g
                  key={p.emoji}
                  onClick={() => setActiveStar(p.emoji)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.r * 1.9}
                    fill="url(#glow)"
                    opacity=".8"
                  />
                  <circle cx={p.x} cy={p.y} r={p.r * 0.24} fill="#fff7da" />
                  <text x={p.x + 2.8} y={p.y - 2.4} fontSize="3.8">
                    {p.emoji}
                  </text>
                </g>
              ))}
            </svg>
            <div className="sky-footer">
              {activeStar
                ? `${activeStar} — ${skyData.find((x) => x[0] === activeStar)?.[1]} moments`
                : "✦ tap a star to explore ✦"}
            </div>
          </div>
          <div className="stats">
            <div>
              <strong>{monthEntries.length}</strong>
              <span>{t.days}</span>
            </div>
            <div>
              <strong>{monthEntries.length * 3}</strong>
              <span>{t.used}</span>
            </div>
            <div>
              <strong>{skyData[0]?.[0]}</strong>
              <span>most frequent</span>
            </div>
          </div>
          <div className="card">
            <label>{t.name}</label>
            <input
              value={starName}
              onChange={(e) => setStarName(e.target.value)}
            />
            <div className="button-row">
              <button className="secondary" onClick={downloadSky}>
                <Download size={16} />
                {t.download}
              </button>
            </div>
          </div>
          {!counts.length && <p className="muted">{t.sampleLabel}</p>}
        </>
      ) : (
        <div className="empty sky-empty">
          <Stars size={35} />
          <h2>{t.emptySky}</h2>
          <button className="primary" onClick={() => openEdit(today())}>
            {t.first}
          </button>
          <button className="text-button" onClick={() => setShowSample(true)}>
            {t.sample}
          </button>
        </div>
      )}
    </>
  );
}
