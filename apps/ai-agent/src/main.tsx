import { StrictMode, Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { defaults, validateEffects } from "./config";
import { loadPublished } from "./api";
import { useSimulation } from "./engine/useSimulation";
import { Experience } from "./components/Experience";
import "./styles.css";
const EffectsEditor = lazy(() => import("./components/EffectsEditor"));
function Visitor() {
  const [config, setConfig] = useState(defaults),
    [failed, setFailed] = useState(false);
  const sim = useSimulation();
  useEffect(() => {
    loadPublished()
      .then((r) => setConfig(validateEffects(r.config)))
      .catch(() => setFailed(true));
  }, []);
  return (
    <>
      <Experience config={config} sim={sim} />
      {failed && (
        <div className="connection-note" role="status">
          Using default effects · Published configuration is unavailable.
        </div>
      )}
    </>
  );
}
function App() {
  return location.pathname.startsWith("/ai/admin") ? (
    <Suspense
      fallback={<div className="auth-loading">Opening Effects Studio…</div>}
    >
      <EffectsEditor />
    </Suspense>
  ) : (
    <Visitor />
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
