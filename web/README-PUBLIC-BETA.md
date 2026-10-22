# Daymark beta

The web app now includes repository implementations for Google-only Supabase Auth, server community, English filtering, reporting, authorized administration, legal pages and emoji fortunes. Follow [DEPLOYMENT-SETUP.md](DEPLOYMENT-SETUP.md) before inviting users; external credentials and hosted deployment are not bundled.

Private journals remain in `daymark.entries` browser storage, shared across accounts using that browser. No automatic upload or migration is performed. Historical `daymark.community.demo` data is retained but never published. Future journal migration must be opt-in, account-scoped, validated and preceded by JSON export; do not reuse community tables for private entries.

Community uses explicit submissions to Supabase. Public projections include only separate public tokens, random aliases, emoji, day and moderation state; flagged text is fetched only on intentional reveal. Authorized administrators can associate shared activity with accounts. Self-disclosed personal details in a post can still identify its author.

Speech recognition uses the browser's service; suggestions and fortunes are local templates/rules. The manifest does not provide complete offline support. Finalize legal review, operator/contact and retention details before public release.

Before sharing: configure a real feedback URL, verify Google sign-in/logout on the actual deployment, test two accounts and admin denial, inspect public responses, and run the setup guide's live checklist. Do not advertise an unconfigured installation as a working shared community.
