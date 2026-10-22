import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { backend, callbackUrl, rpc } from "../services/backend";
import { LEGAL_VERSION, LegalFooter } from "../legal/Legal";

type Access = { accepted: boolean; admin: boolean; suspended: boolean };
const AuthContext = createContext<{
  access: Access;
  logout: () => Promise<void>;
} | null>(null);
export const useAuth = () => useContext(AuthContext)!;
async function restore(): Promise<Session | null> {
  if (!backend) return null;
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const failed =
    url.searchParams.has("error") ||
    new URLSearchParams(url.hash.slice(1)).has("error");
  if (code || failed) {
    // Remove provider responses from browser history, including error descriptions.
    window.history.replaceState({}, "", callbackUrl() + "#/home");
    if (failed)
      throw new Error(
        "Google sign-in was cancelled or refused. Please try again.",
      );
    const { data, error } = await backend.auth.exchangeCodeForSession(code!);
    if (error)
      throw new Error(
        "Sign-in could not be completed. Start again in the same browser.",
      );
    return data.session;
  }
  const { data, error } = await backend.auth.getSession();
  if (error)
    throw new Error(
      "Your session could not be restored. Please sign in again.",
    );
  return data.session;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const lang = localStorage.getItem("daymark.lang") === "nl" ? "nl" : "en";
  async function loadAccess() {
    const result = await rpc<Access>("account_access");
    setAccess(result);
  }
  useEffect(() => {
    let active = true;
    restore()
      .then((s) => {
        if (active) setSession(s);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const listener = backend?.auth.onAuthStateChange((_event, s) => {
      if (active) {
        setSession(s);
        if (!s) setAccess(null);
      }
    });
    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!session) return;
    setAccess(null);
    let active = true;
    rpc<Access>("account_access")
      .then((a) => {
        if (active) setAccess(a);
      })
      .catch(() => {
        if (active)
          setError("Account access could not be checked. Retry or sign out.");
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);
  async function logout() {
    const result = await backend!.auth.signOut();
    if (result.error) {
      setError("Sign-out failed. Please retry.");
      return;
    }
    setSession(null);
    setAccess(null);
    setAgreed(false);
    setError("");
  }
  async function login() {
    if (!agreed || !backend) return;
    setBusy(true);
    setError("");
    try {
      if (session) {
        await rpc("accept_legal", { p_version: LEGAL_VERSION, p_agreed: true });
        await loadAccess();
      } else {
        // Consent is required again after OAuth, then recorded using server time.
        const { error: authError } = await backend.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: callbackUrl(),
            scopes: "openid email profile",
          },
        });
        if (authError) throw authError;
      }
    } catch {
      setError(
        "Google sign-in or consent could not be completed. Please retry; contact the team if it continues.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading || (session && !access && !error))
    return (
      <div className="splash" role="status">
        <div className="brand">daymark ✧</div>
        <p>
          {lang === "nl"
            ? "Je plekje wordt klaargemaakt…"
            : "Preparing your little space…"}
        </p>
      </div>
    );
  if (session && access?.accepted)
    return (
      <AuthContext.Provider value={{ access, logout }}>
        {error && <p role="alert">{error}</p>}
        {children}
      </AuthContext.Provider>
    );
  return (
    <div className="login-page">
      <a className="brand brand-link" href="#/home" aria-label="Daymark home">
        daymark <span aria-hidden="true">✧</span>
      </a>
      <div className="card login-card">
        <div className="hero-emoji">🌷 ☁️ ✨</div>
        <h1>
          {lang === "nl"
            ? "Een momentje voor jezelf."
            : "A little space for you."}
        </h1>
        <p>
          {lang === "nl"
            ? "Drie emoji’s. Jouw kleine momenten."
            : "Three emojis. Your little moments."}
        </p>
        {!backend && (
          <p className="community-warning" role="status">
            Google sign-in is not configured yet. Follow web/DEPLOY.md to
            connect this installation. Your existing local journal has been
            kept.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <label className="consent">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            {lang === "nl" ? "Ik ga akkoord met de " : "I agree to the "}
            <a href="#/terms">Terms & Conditions</a>
            {lang === "nl" ? " en het " : " and "}
            <a href="#/privacy">Privacy Policy</a>.
          </span>
        </label>
        <button
          className="primary"
          disabled={!agreed || busy || !backend}
          onClick={login}
        >
          {busy
            ? "Please wait…"
            : session
              ? "Confirm agreement & continue"
              : "Continue with Google"}
        </button>
        {session && (
          <button className="text-button" onClick={logout}>
            Sign out
          </button>
        )}
        {session && !access && error && (
          <button
            className="secondary"
            onClick={() => {
              setError("");
              void loadAccess().catch(() =>
                setError("Account check failed. Please retry."),
              );
            }}
          >
            Retry account check
          </button>
        )}
        <p className="muted">
          {session
            ? "Confirm the current legal documents to finish account setup."
            : "Your private journal stays in this browser. Sharing is always your choice."}
        </p>
      </div>
      <LegalFooter lang={lang} />
    </div>
  );
}
