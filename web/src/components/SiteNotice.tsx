import { useEffect, useState } from "react";
import { rpc } from "../services/backend";
import type { SiteSettings } from "../community/model";
export function SiteNotice() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  useEffect(() => {
    const load = () => {
      void rpc<SiteSettings>("site_status")
        .then(setSettings)
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);
  return settings &&
    (settings.maintenance ||
      settings.announcement ||
      !settings.posting_enabled) ? (
    <aside className="site-notice" role="status">
      {settings.maintenance && (
        <p>
          Community is paused for maintenance. Your local journal remains
          available.
        </p>
      )}
      {!settings.posting_enabled && !settings.maintenance && (
        <p>Community posting is temporarily paused.</p>
      )}
      {settings.announcement && <p>{settings.announcement}</p>}
    </aside>
  ) : null;
}
