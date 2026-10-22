import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AuthGate } from "./auth/Auth";
import { LegalPage } from "./legal/Legal";
import { JournalApp } from "./JournalApp";
import "./style.css";
import "./features.css";
function Root() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const change = () => setHash(window.location.hash);
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  if (hash === "#/terms" || hash === "#/privacy")
    return <LegalPage kind={hash === "#/terms" ? "terms" : "privacy"} />;
  return (
    <AuthGate>
      <JournalApp />
    </AuthGate>
  );
}
createRoot(document.getElementById("root")!).render(<Root />);
