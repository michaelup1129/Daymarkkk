# Deploy Daymark

Use [DEPLOYMENT-SETUP.md](DEPLOYMENT-SETUP.md) for current Google/Supabase setup, migration, Edge Function deployment, admin provisioning, GitHub Pages and Netlify settings, and the live acceptance checklist.

Node 24 LTS is the CI/team target. Run `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, then `npm run dev`.

Default URL: http://localhost:5173/Daymarkkk/. Root-domain hosting requires `VITE_BASE_PATH=/`. Supabase/Google dashboards must allow the actual host. No external deployment has been performed by this implementation.
