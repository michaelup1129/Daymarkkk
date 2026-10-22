import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyEmoji, getFortuneMessage } from "../src/fortune/messages";
import { constellationPoints } from "../src/constellation/layout";
import { publicPost } from "../src/community/model";
import { decodeEntries } from "../src/storage/localJournal";
import { moderate } from "../src/moderation/moderation";
test("fortune categories, localized pools and unknown fallback", () => {
  for (const [e, c] of [
    ["😭", "comfort"],
    ["😔", "encourage"],
    ["🥰", "love"],
    ["😂", "joy"],
    ["😤", "ground"],
    ["😰", "reassure"],
    ["😴", "rest"],
    ["?", "general"],
  ])
    assert.equal(classifyEmoji(e), c);
  assert.ok(getFortuneMessage("?", "en", () => 0));
  assert.notEqual(
    getFortuneMessage("?", "nl", () => 0),
    getFortuneMessage("?", "en", () => 0),
  );
  assert.notEqual(
    getFortuneMessage("😂", "en", () => 0),
    getFortuneMessage("😂", "en", () => 0.99),
  );
});
test("English filtering: clean boundaries, profanity, evasion, hate and insults", () => {
  for (const s of [
    "Had a great day at the park ☀️",
    "A classic day in Scunthorpe",
    "Coffee with friends",
  ])
    assert.equal(moderate(s).flagged, false, s);
  for (const s of [
    "FUCK",
    "f.u.c.k",
    "sh1t",
    "f u c k",
    "you are worthless",
    "white power",
    "kill all jews",
    "nigger",
    "bitch",
  ])
    assert.equal(moderate(s).flagged, true, s);
  assert.equal(moderate("white power").severity, "high");
});
test("public projection discards account identity and obscures flagged body", () => {
  const result = publicPost({
    token: "public-token",
    alias: "Little star",
    emojis: ["☀️"],
    day: "2026-10-22",
    text: "sensitive",
    flagged: true,
    owner_id: "secret",
    email: "private@example.com",
    id: 5,
  });
  assert.equal(result.text, null);
  assert.equal(JSON.stringify(result).includes("secret"), false);
  assert.equal(Object.hasOwn(result, "id"), false);
});
test("constellation bounds include glow and emoji extents below separate header", () => {
  for (let n = 1; n <= 40; n++) {
    const points = constellationPoints(
      Array.from({ length: n }, (_, i) => [String(i), n - i]),
    );
    assert.ok(points.length <= 18);
    for (const p of points) {
      assert.ok(p.y - p.r * 1.9 > 0);
      assert.ok(p.y - 7 > 0);
      assert.ok(p.x - p.r * 1.9 > 0);
      assert.ok(p.y + p.r * 1.9 < 100);
    }
  }
});
test("journal decode retains existing records and refuses malformed data", () => {
  const records = [
    {
      date: "2026-10-22",
      emojis: ["❤️", "☕", "😴"],
      note: "Private",
      createdAt: "a",
      updatedAt: "b",
    },
  ];
  assert.deepEqual(decodeEntries(JSON.stringify(records)), records);
  assert.throws(() => decodeEntries("{broken"));
  assert.throws(() => decodeEntries("{}"));
  assert.deepEqual(decodeEntries(null), []);
});
