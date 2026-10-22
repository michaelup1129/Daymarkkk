import type { Lang } from "../types";
export const LEGAL_VERSION = "2026-10-22-draft";
export function LegalFooter({ lang = "en" }: { lang?: Lang }) {
  return (
    <footer className="legal-footer">
      <a href="#/terms">
        {lang === "nl" ? "Voorwaarden" : "Terms & Conditions"}
      </a>
      <span aria-hidden="true"> · </span>
      <a href="#/privacy">
        {lang === "nl" ? "Privacybeleid" : "Privacy Policy"}
      </a>
    </footer>
  );
}
export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  return (
    <div className="legal-page">
      <a className="brand brand-link" href="#/home" aria-label="Daymark home">
        daymark <span aria-hidden="true">✧</span>
      </a>
      <h1>{kind === "terms" ? "Terms & Conditions" : "Privacy Policy"}</h1>
      <p className="community-warning">
        Draft for legal review · version {LEGAL_VERSION}. Operator identity,
        contact details, eligibility, retention periods and applicable rights
        procedures must be finalized before public launch.
      </p>
      {kind === "terms" ? (
        <>
          <h2>Your little moments</h2>
          <p>
            Daymark provides personal reflection tools. Supportive messages use
            local templates and do not provide diagnosis, medical advice or
            emergency assistance.
          </p>
          <h2>Accounts and community</h2>
          <p>
            Account access uses Google through Supabase. Only content you
            explicitly submit in Community is shared with other signed-in users.
            Do not share identifying details, harassment, threats, hate speech,
            spam or unlawful content.
          </p>
          <h2>Moderation and availability</h2>
          <p>
            Automated English filtering can obscure potentially offensive posts
            and can make mistakes. Users can reveal or report content.
            Authorized administrators can review reports, hide or remove posts,
            restrict community posting, and pause the service.
          </p>
          <h2>Before public release</h2>
          <p>
            These draft terms require legal review, operator contact details and
            a finalized account support and dispute process.
          </p>
        </>
      ) : (
        <>
          <h2>Private journals stay in your browser</h2>
          <p>
            Your existing journal remains in browser localStorage. It is not
            uploaded by this version and is not isolated by Google account on a
            shared browser. Clearing browser data can remove it. Export JSON
            before clearing data or changing devices.
          </p>
          <h2>Account and shared information</h2>
          <p>
            Google and Supabase process authentication information. Supabase
            stores account IDs, legal acceptance versions and server timestamps,
            explicitly shared community posts, reports, application settings and
            admin audit records. Community feeds return anonymous aliases and
            public post tokens, not Google names, photos, emails or account IDs.
            Authorized administrators can associate shared posts with account
            metadata for moderation.
          </p>
          <h2>Speech and local messages</h2>
          <p>
            Browser speech recognition may send audio to the browser vendor's
            recognition service. Check that provider's practices before enabling
            it. Emoji fortunes and suggestions run locally; private diary text
            is not sent to an AI or moderation API.
          </p>
          <h2>Controls and unresolved policies</h2>
          <p>
            You can delete local entries, export the local journal, delete your
            shared posts and report posts. Automated filtering runs on shared
            text in a Supabase Edge Function. Hosting region, operator identity,
            support contact, retention and account deletion procedures need
            confirmation before public launch. No specific encryption, deletion
            deadline or compliance certification is promised here.
          </p>
        </>
      )}
      <LegalFooter />
      <a href="#/home">← Back to Daymark</a>
    </div>
  );
}
