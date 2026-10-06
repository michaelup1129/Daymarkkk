const assert = require('node:assert/strict');
const { test } = require('node:test');
const { randomUUID } = require('node:crypto');
const { JournalRepository, JOURNAL_KEY } = require('../.expo/storage-tests/storage/repository.js');
const { DataError, decodeJournal } = require('../.expo/storage-tests/storage/model.js');
const { localDate, isLocalDate, noteLength } = require('../.expo/storage-tests/storage/session.js');

const draft = (note = '') => ({ emojis: ['smile', 'coffee', 'moon'], note });
function fixture(raw = null) {
  const disk = {
    raw, writes: 0, readError: false, writeError: false,
    async getItem(key) {
      assert.equal(key, JOURNAL_KEY);
      if (this.readError) throw new Error('Read unavailable');
      return this.raw;
    },
    async setItem(key, value) {
      assert.equal(key, JOURNAL_KEY);
      if (this.writeError) throw new Error('Disk full');
      this.raw = value;
      this.writes += 1;
    },
  };
  let tick = 0;
  const environment = {
    id: randomUUID,
    now: () => new Date(Date.UTC(2026, 9, 6, 12, 0, tick++)),
    timeZone: () => 'Europe/Amsterdam',
  };
  return { disk, open: () => new JournalRepository(disk, environment) };
}

test('first load does not write or initialize storage', async () => {
  const f = fixture();
  assert.deepEqual(await f.open().load(), { schemaVersion: 1, entries: {}, recent: [] });
  assert.equal(f.disk.writes, 0);
});

test('entries and recent emoji survive a new repository instance', async () => {
  const f = fixture();
  const saved = await f.open().save('2026-10-06', draft('하루'));
  assert.deepEqual(await f.open().load(), saved);
  const entry = saved.entries['2026-10-06'];
  assert.equal(entry.note, '하루');
  assert.equal(entry.timeZone, 'Europe/Amsterdam');
  assert.equal(entry.schemaVersion, 1);
  assert.equal(entry.deletedAt, null);
});

test('editing one date preserves ID and creation time without adding an entry', async () => {
  const repo = fixture().open();
  const first = (await repo.save('2026-10-06', draft('first'))).entries['2026-10-06'];
  const second = await repo.save('2026-10-06', draft('second'));
  assert.equal(Object.keys(second.entries).length, 1);
  assert.equal(second.entries['2026-10-06'].id, first.id);
  assert.equal(second.entries['2026-10-06'].createdAt, first.createdAt);
  assert.notEqual(second.entries['2026-10-06'].updatedAt, first.updatedAt);
  assert.equal(second.entries['2026-10-06'].note, 'second');
});

test('rapid saves and recent updates are serialized without losing different dates', async () => {
  const repo = fixture().open();
  await Promise.all([
    repo.save('2026-10-05', draft('yesterday')),
    repo.remember('tree'),
    repo.save('2026-10-06', draft('today')),
    repo.remember('cat'),
  ]);
  const result = await repo.load();
  assert.equal(result.entries['2026-10-05'].note, 'yesterday');
  assert.equal(result.entries['2026-10-06'].note, 'today');
  assert.equal(result.recent[0], 'cat');
  assert.ok(result.recent.includes('tree'));
});

test('input is captured before an asynchronous save starts', async () => {
  const repo = fixture().open();
  const input = draft('original');
  const pending = repo.save('2026-10-06', input);
  input.emojis[0] = 'sad';
  input.note = 'modified';
  const saved = await pending;
  assert.equal(saved.entries['2026-10-06'].note, 'original');
  assert.equal(saved.entries['2026-10-06'].emojis[0], 'smile');
});

test('recent list is deduplicated, bounded, and persisted independently of entries', async () => {
  const f = fixture();
  const repo = f.open();
  for (const id of ['smile', 'laugh', 'love', 'calm', 'tired', 'sad', 'angry', 'party',
    'study', 'work', 'run', 'music', 'cat', 'cat']) await repo.remember(id);
  const result = await f.open().load();
  assert.equal(result.recent.length, 12);
  assert.equal(new Set(result.recent).size, 12);
  assert.equal(result.recent[0], 'cat');
  assert.deepEqual(result.entries, {});
});

test('80 composed characters are allowed, 81 rejected, invalid emoji and dates rejected', async () => {
  const repo = fixture().open();
  assert.equal(noteLength('👨‍👩‍👧‍👦'), 1);
  assert.equal(noteLength('e\u0301'), 1);
  assert.equal(noteLength('한'), 1);
  await repo.save('2026-10-06', draft('👨‍👩‍👧‍👦'.repeat(80)));
  await assert.rejects(repo.save('2026-10-06', draft('가'.repeat(81))));
  await assert.rejects(repo.save('2026-02-30', draft()));
  await assert.rejects(repo.save('2026-10-06', { emojis: ['smile', 'bad', 'moon'], note: '' }));
  await assert.rejects(repo.save('2026-10-06', { emojis: ['smile', null, 'moon'], note: '' }));
  assert.equal(noteLength((await repo.load()).entries['2026-10-06'].note), 80);
});

test('read failure preserves existing bytes and prevents writes', async () => {
  const f = fixture();
  const repo = f.open();
  await repo.save('2026-10-06', draft('keep'));
  const before = f.disk.raw;
  f.disk.readError = true;
  await assert.rejects(repo.load());
  await assert.rejects(repo.save('2026-10-06', draft('unsafe')));
  assert.equal(f.disk.raw, before);
  assert.equal(f.disk.writes, 1);
  f.disk.readError = false;
  assert.equal((await repo.load()).entries['2026-10-06'].note, 'keep');
});

test('write failure rejects, retains saved data and input, and does not poison the queue', async () => {
  const f = fixture();
  const repo = f.open();
  await repo.save('2026-10-06', draft('keep'));
  const before = f.disk.raw;
  const input = draft('retry me');
  f.disk.writeError = true;
  await assert.rejects(repo.save('2026-10-06', input));
  assert.equal(f.disk.raw, before);
  assert.equal(input.note, 'retry me');
  f.disk.writeError = false;
  assert.equal((await repo.save('2026-10-06', input)).entries['2026-10-06'].note, 'retry me');
});

test('success resolves only after the underlying write completes', async () => {
  const f = fixture();
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  const original = f.disk.setItem.bind(f.disk);
  f.disk.setItem = async (key, value) => { await barrier; await original(key, value); };
  let resolved = false;
  const pending = f.open().save('2026-10-06', draft()).then(() => { resolved = true; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(resolved, false);
  assert.equal(f.disk.raw, null);
  release();
  await pending;
  assert.equal(resolved, true);
  assert.ok(f.disk.raw);
});

test('corrupt and unsupported data remain untouched by reads or attempted writes', async () => {
  for (const raw of ['{bad json', 'null', JSON.stringify({ schemaVersion: 99 }),
    JSON.stringify({ schemaVersion: 1, entries: [], recent: [] }),
    JSON.stringify({ schemaVersion: 1, entries: {}, recent: ['bad'] })]) {
    const f = fixture(raw);
    const repo = f.open();
    await assert.rejects(repo.load(), DataError);
    await assert.rejects(repo.remember('smile'), DataError);
    await assert.rejects(repo.save('2026-10-06', draft()), DataError);
    assert.equal(f.disk.raw, raw);
    assert.equal(f.disk.writes, 0);
  }
});

test('schema validation rejects malformed entry fields and mismatched dates', async () => {
  const f = fixture();
  const saved = await f.open().save('2026-10-06', draft());
  for (const patch of [{ id: 'bad' }, { localDate: '2026-10-05' }, { note: 5 },
    { emojis: ['smile'] }, { createdAt: 'yesterday' }, { deletedAt: 7 }, { schemaVersion: 2 }]) {
    const modified = JSON.parse(JSON.stringify(saved));
    Object.assign(modified.entries['2026-10-06'], patch);
    assert.throws(() => decodeJournal(JSON.stringify(modified)), DataError);
  }
});

test('deletion persists a tombstone and saving again preserves the original identity', async () => {
  const f = fixture();
  const repo = f.open();
  const original = (await repo.save('2026-10-06', draft())).entries['2026-10-06'];
  await repo.remove('2026-10-06');
  const deleted = (await f.open().load()).entries['2026-10-06'];
  assert.ok(deleted.deletedAt);
  const restored = (await repo.save('2026-10-06', draft('back'))).entries['2026-10-06'];
  assert.equal(restored.id, original.id);
  assert.equal(restored.createdAt, original.createdAt);
  assert.equal(restored.deletedAt, null);
});

test('calendar dates are validated without UTC shifting local midnight', () => {
  assert.equal(isLocalDate('2024-02-29'), true);
  assert.equal(isLocalDate('2026-02-29'), false);
  assert.equal(isLocalDate('2026-13-01'), false);
  const previous = process.env.TZ;
  try {
    for (const zone of ['Europe/Amsterdam', 'Pacific/Kiritimati', 'America/Los_Angeles']) {
      process.env.TZ = zone;
      assert.equal(localDate(new Date(2026, 9, 6, 0, 1)), '2026-10-06');
      assert.equal(localDate(new Date(2026, 9, 6, 23, 59)), '2026-10-06');
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
