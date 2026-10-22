import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("PostgreSQL authorization, safe community API, moderation/admin and audit", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
 create table auth.users(id uuid primary key,email text);create table auth.identities(user_id uuid,provider text);
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema public,auth to anon,authenticated,service_role;
 grant execute on function auth.uid() to public;`);
    await db.exec(
      await readFile(
        new URL(
          "../../supabase/migrations/202610220001_community.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const a = "00000000-0000-4000-8000-000000000001",
      b = "00000000-0000-4000-8000-000000000002",
      admin = "00000000-0000-4000-8000-000000000003";
    for (const id of [a, b, admin])
      await db.exec(
        `insert into auth.users values('${id}','${id}@example.com');insert into auth.identities values('${id}','google');`,
      );
    async function as(role: string, id: string, query: string) {
      await db.exec(
        `reset role;set role ${role};set request.jwt.claim.sub='${id}';`,
      );
      return db.query(query);
    }
    await assert.rejects(as("anon", "", "select public.community_feed()"));
    await assert.rejects(
      as("authenticated", a, "select public.community_feed()"),
    );
    await assert.rejects(
      as(
        "authenticated",
        a,
        `select public.accept_legal('2026-10-22-draft',false)`,
      ),
    );
    for (const id of [a, b, admin])
      await as(
        "authenticated",
        id,
        `select public.accept_legal('2026-10-22-draft',true)`,
      );
    await assert.rejects(
      as("authenticated", a, "select * from private.accounts"),
    );
    await assert.rejects(
      as(
        "authenticated",
        a,
        `select public.publish_moderated('${a}',array['☀️','❤️','😴'],'forged',false,array[]::text[],'none')`,
      ),
    );
    await assert.rejects(
      as(
        "authenticated",
        a,
        `select public.admin_action('settings','site','{}')`,
      ),
    );
    await assert.rejects(
      as("authenticated", a, "select public.admin_snapshot()"),
    );
    const saved = await as(
      "service_role",
      "",
      `select public.publish_moderated('${a}',array['☀️','❤️','😴'],'flagged body',true,array['offensive-language'],'medium') token`,
    );
    const token = (saved.rows[0] as { token: string }).token;
    await assert.rejects(
      as(
        "service_role",
        "",
        `select public.publish_moderated('${a}',array['☀️','❤️','😴'],'second',false,array[]::text[],'none')`,
      ),
    );
    const feed = await as(
      "authenticated",
      b,
      "select public.community_feed() feed",
    );
    const post = (feed.rows[0] as any).feed[0];
    assert.equal(post.text, null);
    assert.equal(post.mine, false);
    assert.equal(post.token, token);
    assert.equal(JSON.stringify(post).includes(a), false);
    assert.equal(JSON.stringify(post).includes("email"), false);
    await as("authenticated", b, `select public.delete_own_post('${token}')`);
    assert.equal(
      (await as("authenticated", a, "select public.community_feed() feed")).rows
        .length,
      1,
    );
    await as(
      "authenticated",
      b,
      `select public.report_post('${token}','Please review')`,
    );
    await as(
      "authenticated",
      b,
      `select public.report_post('${token}','duplicate')`,
    );
    await db.exec(`reset role;insert into private.admins values('${admin}');`);
    const snapshot = await as(
      "authenticated",
      admin,
      "select public.admin_snapshot() data",
    );
    assert.equal((snapshot.rows[0] as any).data.reports.length, 1);
    await as(
      "authenticated",
      admin,
      `select public.admin_action('hide','${token}')`,
    );
    assert.deepEqual(
      (await as("authenticated", b, "select public.community_feed() feed"))
        .rows[0],
      { feed: [] },
    );
    assert.equal(
      (
        await as(
          "authenticated",
          b,
          `select public.reveal_post('${token}') text`,
        )
      ).rows[0].text,
      null,
    );
    await as(
      "authenticated",
      admin,
      `select public.admin_action('unhide','${token}')`,
    );
    assert.equal(
      (
        await as(
          "authenticated",
          b,
          `select public.reveal_post('${token}') text`,
        )
      ).rows[0].text,
      "flagged body",
    );
    await as(
      "authenticated",
      admin,
      `select public.admin_action('settings','site','{"maintenance":true,"posting_enabled":false,"announcement":"Pause"}')`,
    );
    await assert.rejects(
      as("authenticated", b, "select public.community_feed()"),
    );
    await as(
      "authenticated",
      admin,
      `select public.admin_action('cleanup_user','${a}')`,
    );
    const audit = await as(
      "authenticated",
      admin,
      "select public.admin_snapshot() data",
    );
    assert.equal((audit.rows[0] as any).data.audit.length, 4);
  } finally {
    await db.close();
  }
});
