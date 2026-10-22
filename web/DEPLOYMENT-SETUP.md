# MANUAL CONFIGURATION REQUIRED

Repository code is implemented, but no hosted Supabase project, Google credentials or administrator have been configured by this change. Do not claim live OAuth or multi-user deployment success before the final checks below.

## 1. Supabase project and database

1. Create a Supabase project. Record its project reference and HTTPS project URL from Project Settings → API. Do not copy the database password or service-role key into Vite.
2. In the Supabase SQL editor run `supabase/migrations/202610220001_community.sql` **once**, or use `npx supabase link --project-ref YOUR_PROJECT_REF` then `npx supabase db push` from the repository root. Inspect migrations before applying to an existing project.
3. Keep the `private` schema **out of exposed API schemas**. There must be no browser table grants on it. This migration enables RLS on every relation and denies direct access; narrow security-definer functions form the API.
4. In Authentication → Providers, enable **only Google**. Disable email/password, anonymous sign-ins and other providers for this product. The data API additionally requires a Google identity and current legal acceptance.
5. Account consent is recorded by `accept_legal` using database timestamps and version `2026-10-22-draft`. Accounts without current acceptance cannot use community/admin APIs. It is intentionally re-confirmed after OAuth; a frontend checkbox alone grants no data permissions.

## 2. Google Cloud OAuth client

Create an OAuth 2.0 **Web application** client in Google Auth Platform → Clients.

Authorized JavaScript origins (origins never contain paths):

```text
http://localhost:5173
https://michaelup1129.github.io
```

Add any actual Netlify/Vercel/custom-domain origin separately.

Authorized redirect URI — Google returns to **Supabase**, not directly to the Vite app:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

Use the exact callback shown by Supabase's Google provider dashboard if using a custom auth domain. Put Google's client ID and client secret **only** in that Supabase provider configuration. Never add the Google secret to GitHub variables, Vite or source code.

Configure Branding / Audience / Data Access: app name, support and developer contacts, authorized domains, published Terms/Privacy URLs, scopes `openid`, `email`, `profile`. While the consent screen is in testing, add the Google accounts used for testing. Complete provider verification/publishing as required by the selected audience. Do not manually construct Google's authorization URL, state or PKCE verifier; the SDK/provider owns those.

## 3. Supabase Auth URL configuration

Production Site URL for current GitHub Pages hosting:

```text
https://michaelup1129.github.io/Daymarkkk/
```

Exact Additional Redirect URLs:

```text
http://localhost:5173/Daymarkkk/
https://michaelup1129.github.io/Daymarkkk/
```

For root-domain deployment add `https://YOUR_HOST/` and set Vite base to `/`. No physical `/callback` route is needed: the SPA exchanges `?code=...` at its real base directory, clears the response from browser history, then uses hash navigation. Codes are single-use; start and finish PKCE in the same browser/origin/storage context. Refresh restores the Supabase session. Google error details are not echoed into the UI.

## 4. Edge Function deployment

From repository root, authenticated to your Supabase account:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set ALLOWED_ORIGINS="http://localhost:5173,https://michaelup1129.github.io"
npx supabase functions deploy community-publish
```

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in hosted Edge Functions. The service key never enters the browser. `verify_jwt=false` in function config is deliberate: the handler verifies the bearer token with `auth.getUser()` before privileged work, supporting current publishable keys. A missing/invalid token is rejected. CORS is an additional browser restriction, not authorization. Include actual root/custom-host origins in `ALLOWED_ORIGINS`.

The function imports shared TypeScript from `web/src/data/emojis.ts` and `web/src/moderation/moderation.ts`; deploy from the complete repository. Its pinned Deno import map resolves npm dependencies.

## 5. Frontend environment and hosting

Copy `web/.env.example` to `web/.env.local` and replace:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_REAL_PUBLIC_KEY
VITE_BASE_PATH=/Daymarkkk/
VITE_FEEDBACK_URL=https://YOUR_REAL_FEEDBACK_FORM
```

Legacy Supabase `anon` JWT keys are also accepted. `service_role` JWT keys and `sb_secret_...` keys are rejected in the client. Vite values are public and build-time; rebuild after changes.

- GitHub Pages: set repository **Actions variables** for `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, optionally `VITE_FEEDBACK_URL`. Workflow uses Node 24 and `/Daymarkkk/`. Set Settings → Pages → Source to GitHub Actions. Deploy by normal reviewed PR/merge; no deployment is performed by this implementation task.
- Netlify: base directory `web`, build `npm run build`, publish `dist`, environment `VITE_BASE_PATH=/` plus Supabase public values. Configure actual origin and redirect in both Supabase and Google.
- Legal URLs: `https://michaelup1129.github.io/Daymarkkk/#/terms` and `#/privacy`. Hash routing avoids GitHub Pages direct-navigation 404s. Manifest uses relative start/scope; no full offline capability is claimed.

## 6. First administrator

Sign in with Google, confirm legal documents, then obtain that account's UUID from Supabase Authentication → Users. In the SQL editor (trusted operator only):

```sql
insert into private.admins(user_id) values ('REPLACE_WITH_VERIFIED_USER_UUID');
```

Refresh/sign in again and open `#/admin`. Admin membership is never read from editable user metadata, email comparisons or localStorage. All admin data/actions recheck database membership. Revoke using `delete from private.admins where user_id = 'EXACT_UUID';` in the SQL editor.

Admin cleanup deletes **shared community activity and related reports only**. It does not delete Google accounts, Supabase auth users or browser-private journals. Suspension blocks new community posts. Auth account deletion is a separate dashboard workflow requiring an operator decision; the browser exposes no general database console.

## 7. Live acceptance checklist (requires configured project)

1. Start at `http://localhost:5173/Daymarkkk/`. Unchecked checkbox disables Google; select it and continue. Check provider authorization uses correct client/callback. Complete Google flow and confirm legal agreement. Refresh, log out, and sign back in.
2. Repeat on deployed GitHub Pages URL; verify no path 404. If `invalid_request` remains, record Google's error code and non-secret request fields, then compare **client ID**, Google callback URI, consent audience, Supabase redirect allowlist and correct project environment. No confirmed dashboard root cause is available from this repository.
3. Use separate browsers/accounts A and B. Publish from A; B refreshes Community and sees the post without A's account ID/email/name/photo. Inspect network payloads. Private diary entries and historical demo posts must never appear automatically.
4. Post offensive test content using a test account. Feed returns `text: null` with a warning; text is fetched only on intentional reveal. Report twice; admin should see one report. An account's 24-hour allowance remains consumed even after deleting its post.
5. Attempt `admin_snapshot`, `admin_action`, `publish_moderated` and direct private table calls with B's normal token: all must be denied where applicable. Manipulating UI state cannot change SQL permissions.
6. Provision admin, hide/unhide/remove posts, review reports, suspend/restore an account, clean its shared content, change announcement/posting/maintenance flags, verify admin-only audit records. Confirm destructive UI prompts.
7. Finalize legal review, operator/contact and retention/deletion procedures before opening to real users. Automated English filtering is fallible; community operational abuse controls may need further rate limits/CAPTCHA and monitoring at larger scale.

Official references: [Google OAuth setup](https://supabase.com/docs/guides/auth/social-login/auth-google), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [database function permissions](https://supabase.com/docs/guides/database/functions), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
