# Web implementation work log — 2026-10-22

## 1. Verified audit and architecture decision (before implementation)

- Working branch `main` at `83e0843` is clean and has no authentication implementation, backend SDK, legal pages, or server database. Its community is localStorage-only.
- **Important additional evidence:** locally available remote branch `origin/add-daymark-web` at `305eaf5` DOES contain an unmerged Supabase Google login attempt, Terms/Privacy pages, and `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`. It uses `redirectTo: window.location.origin`, root-only legal paths and `base: '/'`. These conflict with the main branch's GitHub Pages sub-path. They do not prove the reported Google `invalid_request` root cause. No dashboard access or failing OAuth response is available.
- Continue the already intended **Supabase** architecture: managed Google Auth with PKCE, Postgres private tables with RLS, narrow authorized RPCs, and an Edge Function for trusted English moderation before insertion. No custom framework/backend server migration.
- Private journal data remains in the existing `daymark.entries` browser key. Historical demo community data remains untouched but is never published automatically. Account/community data is server-backed. No private journal upload.
- Only browser publishable credentials enter Vite. Service credentials remain Edge Function environment values. Admin roles are provisioned in private SQL, never user metadata or frontend state. Expo can later reuse Auth, RPCs and Edge Functions.
- Hash navigation retains direct-link support on GitHub Pages. OAuth returns to the physical base directory with `?code=…`, exchanged once using PKCE.
- Existing English/Dutch journal UI, speech, exports and onboarding will be retained; auth, legal, community, admin, fortune and constellation become separate modules.

## Verification scope

External Supabase and Google dashboard configuration is required before a real OAuth/multi-user acceptance test. Repository tests cover pure logic, PostgreSQL authorization with an isolated local engine, and browser flows with explicit test mocks. These do not constitute a live provider test.

## 2. Authentication, legal pages and preserved storage — implemented

- Google-only Supabase PKCE, base-aware callback, session restore/refresh, error/loading/login/logout states. No custom Google OAuth URL construction. Secrets are not supplied to the client.
- An initially unchecked pre-login consent box, working hash legal links, and a second server-recorded legal confirmation after OAuth. Current consent version is checked in the SQL account/community APIs; consent is unrelated to admin authorization.
- Existing local journal and historical demo community keys remain unchanged. Journal writes occur only on explicit changes; malformed data is retained and write failures are reported rather than announced as successful saves.
- `main.tsx` is a small entry point; existing journal UI, emoji data, translations, constellation, auth, community, legal and admin are separate modules.

## 3. Constellation and fortunes — implemented

- Header uses normal document flow above a separate SVG drawing area. Generated nodes reserve radius/emoji clearance in a bounded coordinate region; no viewport-specific offset.
- English/Dutch fortune pools classify selected emojis, choose locally from safe templates, and provide a generic fallback. No AI subscription or journal-text API call.
- SVG/JSON exports, calendar, journal CRUD, Dutch/English switching, onboarding and browser speech/rule suggestions retained. Existing CSS retained with scoped feature overrides.

## 4. Community, moderation, reports and admin — implemented in repository

- Private Postgres tables with RLS, explicit grants/revokes, fixed search paths and narrow RPC projections. Ordinary clients never receive internal owner IDs, Google account metadata, report authors or database post primary keys.
- Verified-token Edge Function performs English package-based filtering, normalization and basic evasion/abuse/hate checks before a service-only insertion RPC. Ordinary users cannot bypass filtering via table writes or that RPC.
- Flagged text is absent from feed payloads and DOM; intentional reveal fetches it separately. Shared content is opt-in; no private historical journal upload. A rolling 24-hour posting allowance is checked under an account row lock and survives post deletion.
- Reports deduplicate per reporter/post, remain private and have a basic hourly cap.
- Admin roles are provisioned only through trusted SQL. Every snapshot/mutation checks server membership; UI state cannot authorize an action. User lookup, posting suspension, shared-activity cleanup, hide/unhide/delete, report review, settings and audit are implemented. Destructive UI actions require confirmation. Private browser journals and auth accounts are not bulk-deleted.
- Settings include community maintenance, posting toggle and announcement. Maintenance pauses server community; local journaling remains available. Feed/admin queries are bounded to the latest 100 records; pagination is a follow-up.

## 5. Deployment and documentation — implemented

- Configurable Vite base (default `/Daymarkkk/`, `/` supported), hash routes, relative manifest start/scope and UTF-8 HTML.
- `.env.example`, public-only GitHub build variables, and Node 24 check workflow. Complete external setup and real-user verification steps are in `web/DEPLOYMENT-SETUP.md`.

## 6. Actual checks and results

Executed with **Node 24.22.1** (using `npx --yes --package node@24 --call "COMMAND"` because the host default is Node 22):

- `npm ci`: pass; 42 installed/audited packages, 0 vulnerabilities.
- `npm run typecheck`: pass.
- `npm test`: **6/6 pass**, including isolated PostgreSQL migration execution and denied anonymous/ordinary-user calls, service-only insertion, rate limit, safe feed, reports, moderation mutations, maintenance, cleanup and audit.
- `npm run test:e2e`: **11/11 Chromium tests pass**. Includes actual SDK OAuth request construction (Google, correct redirect, S256 PKCE), mocked callback exchange, consent gate, auth error, logout, journal CRUD/persistence/export, Dutch, community reveal/report, normal-user admin denial, authorized admin report inspection and destructive confirmation, and 320/390/768/1440px header bounds.
- `npm run build`: pass for both GitHub Pages default and configured root deployment with dummy publishable test configuration. Lucide `use client` bundling warnings remain non-fatal.
- `npx --yes deno check --config supabase/functions/community-publish/deno.json supabase/functions/community-publish/index.ts`: pass.
- Development startup: Playwright starts the actual Vite server at port 5173 and exercises the application.
- `git diff --check`: pass. `git diff --quiet -- mobile`: pass (no mobile changes).
- No web lint command/config existed; no lint pass is claimed.

## 7. Not verified externally / remaining limits

- No actual Google Cloud configuration, hosted SQL migration, Edge Function deployment, live OAuth login, real multi-account networking or first-admin provisioning was performed. Setup values are placeholders; the unconfigured app shows a clear login configuration message.
- Docker daemon is unavailable; PostgreSQL authorization is tested with PGlite and a minimal Supabase-auth schema fixture, not a complete local Supabase deployment. Deno typechecking verifies function imports but not the hosted gateway/runtime.
- No microphone/provider-permission test or physical-device test. Browser speech code was retained.
- Local journals remain browser-scoped, not account-scoped/cloud-synced; shared browsers require care. No JSON import or automatic migration was added.
- Draft legal pages require operator/contact/retention review. Dictionary-based English moderation can make mistakes; contextual/multilingual moderation and operational abuse defenses remain future work.
- No commit, push or public deployment performed. Changes remain reviewable in the worktree.
