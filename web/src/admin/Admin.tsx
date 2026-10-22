import { useEffect, useState } from "react";
import { useAuth } from "../auth/Auth";
import { rpc } from "../services/backend";
import type { SiteSettings } from "../community/model";
type Account = {
  id: string;
  email: string;
  created_at: string;
  suspended: boolean;
  post_count: number;
  report_count: number;
};
type AdminPost = {
  token: string;
  owner: string;
  text: string;
  emojis: string[];
  hidden: boolean;
  flagged: boolean;
  severity: string;
};
type Report = {
  id: string;
  post_token: string;
  reason: string;
  status: string;
  text: string;
  emojis: string[];
  flagged: boolean;
  hidden: boolean;
};
type Audit = {
  actor: string;
  action: string;
  target: string;
  created_at: string;
};
type Snapshot = {
  users: Account[];
  posts: AdminPost[];
  reports: Report[];
  audit: Audit[];
  settings: SiteSettings;
};
export function Admin() {
  const { access } = useAuth();
  const [data, setData] = useState<Snapshot | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  async function load() {
    try {
      const d = await rpc<Snapshot>("admin_snapshot", { p_search: search });
      setData(d);
      setSettings(d.settings);
      setError("");
    } catch {
      setError("Admin request denied or unavailable.");
    }
  }
  useEffect(() => {
    if (access.admin) void load();
  }, [access.admin]);
  async function action(
    action: string,
    target: string,
    confirm = false,
    payload: unknown = {},
  ) {
    if (
      confirm &&
      !window.confirm(
        `Confirm ${action} for ${target}? This affects shared community content only.`,
      )
    )
      return;
    setBusy(true);
    try {
      await rpc("admin_action", {
        p_action: action,
        p_target: target,
        p_payload: payload,
      });
      await load();
    } catch {
      setError("Action denied or failed. Please refresh and retry.");
    } finally {
      setBusy(false);
    }
  }
  if (!access.admin)
    return <p role="alert">Administrator access is required.</p>;
  return (
    <div className="admin-grid">
      <div className="eyebrow">DAYMARK ADMINISTRATION</div>
      <h1>Care for this space</h1>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label htmlFor="account-search">
          Locate account by email, ID or alias
        </label>
        <input
          id="account-search"
          maxLength={100}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="secondary">Search / refresh</button>
      </form>
      {!data && <p role="status">Loading authorized data…</p>}
      {settings && (
        <section className="card">
          <h2>Maintenance</h2>
          <label>
            <input
              type="checkbox"
              checked={settings.maintenance}
              onChange={(e) =>
                setSettings({ ...settings, maintenance: e.target.checked })
              }
            />{" "}
            Pause community for maintenance
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={settings.posting_enabled}
              onChange={(e) =>
                setSettings({ ...settings, posting_enabled: e.target.checked })
              }
            />{" "}
            Allow community posting
          </label>
          <label htmlFor="announcement">Announcement</label>
          <textarea
            id="announcement"
            maxLength={500}
            value={settings.announcement}
            onChange={(e) =>
              setSettings({ ...settings, announcement: e.target.value })
            }
          />
          <button
            className="primary"
            disabled={busy}
            onClick={() => action("settings", "site", true, settings)}
          >
            Save maintenance settings
          </button>
        </section>
      )}
      <h2>Accounts</h2>
      {data?.users.map((u) => (
        <section className="card admin-row" key={u.id}>
          <strong>{u.email}</strong>
          <p>
            {u.id} · joined {u.created_at}
          </p>
          <p>
            {u.post_count} posts · {u.report_count} received reports ·{" "}
            {u.suspended ? "Community suspended" : "Active"}
          </p>
          <div className="button-row">
            <button
              className="secondary"
              disabled={busy}
              onClick={() =>
                action(u.suspended ? "unsuspend" : "suspend", u.id, true)
              }
            >
              {u.suspended ? "Restore posting" : "Suspend posting"}
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={() => action("cleanup_user", u.id, true)}
            >
              Remove user’s community activity
            </button>
          </div>
        </section>
      ))}
      <h2>Community moderation</h2>
      {data?.posts.map((p) => (
        <section className="card admin-row" key={p.token}>
          <p>
            {p.owner} · {p.hidden ? "Hidden" : "Visible"} ·{" "}
            {p.flagged ? p.severity : "Clean"}
          </p>
          <details>
            <summary>Inspect shared content</summary>
            <p className="community-story">
              {p.emojis.join(" ")} {p.text}
            </p>
          </details>
          <div className="button-row">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => action(p.hidden ? "unhide" : "hide", p.token)}
            >
              {p.hidden ? "Unhide" : "Hide"}
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={() => action("remove_post", p.token, true)}
            >
              Remove
            </button>
          </div>
        </section>
      ))}
      <h2>Reports</h2>
      {data?.reports.map((r) => (
        <section className="card" key={r.id}>
          <p>
            Post {r.post_token} · {r.status}
          </p>
          <details>
            <summary>Inspect reported post and reason</summary>
            <p>
              {r.flagged ? "Flagged" : "Not automatically flagged"} ·{" "}
              {r.hidden ? "Hidden" : "Visible"}
            </p>
            <p className="community-story">
              {r.emojis.join(" ")} {r.text}
            </p>
            <p>{r.reason}</p>
          </details>
          <div className="button-row">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => action(r.hidden ? "unhide" : "hide", r.post_token)}
            >
              {r.hidden ? "Unhide post" : "Hide post"}
            </button>
            <button
              className="danger"
              disabled={busy}
              onClick={() => action("remove_post", r.post_token, true)}
            >
              Remove reported post
            </button>
          </div>
          <button
            className="secondary"
            disabled={busy || r.status === "reviewed"}
            onClick={() => action("review_report", r.id)}
          >
            Mark reviewed
          </button>
        </section>
      ))}
      <h2>Recent audit</h2>
      {data?.audit.map((a, i) => (
        <p key={i}>
          {a.created_at} · {a.actor} · {a.action} · {a.target}
        </p>
      ))}
    </div>
  );
}
