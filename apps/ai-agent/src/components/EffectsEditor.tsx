import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Download,
  Eye,
  Film,
  FlaskConical,
  Globe2,
  Layers3,
  LockKeyhole,
  LogOut,
  Maximize2,
  Monitor,
  MoreHorizontal,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  SkipForward,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Upload,
  WandSparkles,
  Waves,
} from "lucide-react";
import { api, loadDraft, loadPublished } from "../api";
import {
  builtins,
  defaults,
  fields,
  validateEffects,
  type AdminDocument,
  type Effects,
  type Group,
  type Preset,
} from "../config";
import { useSimulation } from "../engine/useSimulation";
import { scenarios, type ScenarioId } from "../engine/providers";
import { Experience } from "./Experience";
const groups: { id: Group; label: string; icon: typeof Sparkles }[] = [
  { id: "welcome", label: "Welcome button", icon: MousePointer2 },
  { id: "transition", label: "Transition", icon: Waves },
  { id: "orb", label: "AI orb", icon: Globe2 },
  { id: "cards", label: "Tour cards", icon: Layers3 },
  { id: "motion", label: "Global motion", icon: WandSparkles },
];
const key = "hub-ai-effects-draft-v1";
function readLocal(): Effects | undefined {
  try {
    const s = localStorage.getItem(key);
    if (s) return validateEffects(JSON.parse(s));
  } catch {
    /* Invalid browser drafts are ignored. */
  }
  return undefined;
}
function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="login-page">
      <a className="login-back" href="/ai">
        <ArrowLeft size={16} />
        Back to the experience
      </a>
      <div className="login-orbit" />
      <form
        className="login-card glass"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await api("admin/login", { password });
            setPassword("");
            onLogin();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="studio-mark">
          <SlidersHorizontal size={26} />
        </div>
        <span className="eyebrow">THE HUB · CREATIVE CONTROLS</span>
        <h1>
          Make it feel
          <br />
          <span>like The Hub.</span>
        </h1>
        <p>
          Sign in to shape the experience.
          <br />
          Your imagination. Every little detail.
        </p>
        <label htmlFor="admin-password">Administrator password</label>
        <div className="login-input">
          <LockKeyhole size={16} />
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            maxLength={256}
            placeholder="Enter your password"
          />
        </div>
        <button className="primary-button" disabled={busy}>
          {busy ? "Signing in…" : "Open Effects Studio"}
          <ArrowRight size={17} />
        </button>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <span className="login-assurance">
          <ShieldCheck size={14} />
          Protected admin access · Preview environment
        </span>
      </form>
      <footer>THE HUB — FRESH CLOTHES FOR EVERY JOURNEY</footer>
    </div>
  );
}
export default function EffectsEditor() {
  const [auth, setAuth] = useState<"loading" | "signed-out" | "admin">(
      "loading",
    ),
    [config, setConfig] = useState<Effects>(defaults),
    [published, setPublished] = useState<Effects>(defaults),
    [presets, setPresets] = useState<Preset[]>([]),
    [group, setGroup] = useState<Group>("orb"),
    [dirty, setDirty] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [viewport, setViewport] = useState("desktop"),
    [viewPublished, setViewPublished] = useState(false),
    [presetName, setPresetName] = useState("My glass preset"),
    [menu, setMenu] = useState(false),
    [help, setHelp] = useState(false),
    [timeline, setTimeline] = useState(true),
    [publishedAt, setPublishedAt] = useState(""),
    [present, setPresent] = useState(true);
  const imported = useRef<HTMLInputElement>(null),
    sim = useSimulation();
  const loaded = useRef(false),
    sequenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    api("admin/me")
      .then(() => setAuth("admin"))
      .catch(() => setAuth("signed-out"));
  }, []);
  useEffect(() => {
    if (auth !== "admin") return;
    let active = true;
    Promise.all([loadDraft(), loadPublished()])
      .then(([draft, pub]) => {
        if (!active) return;
        setConfig(readLocal() || validateEffects(draft.draft));
        setPresets(draft.presets);
        setPublished(validateEffects(pub.config));
        setPublishedAt(pub.publishedAt || "");
        setDirty(!!readLocal());
        loaded.current = true;
      })
      .catch((err) => {
        if (active) setError((err as Error).message);
      });
    return () => {
      active = false;
    };
  }, [auth]);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(config));
    } catch {
      setError(
        "Browser storage is full. Use Save Draft to keep your changes on the server.",
      );
    }
  }, [config]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  useEffect(
    () => () => {
      if (sequenceTimer.current) clearTimeout(sequenceTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(t);
  }, [message]);
  const change = (next: Effects) => {
    setConfig(next);
    setDirty(true);
    setViewPublished(false);
  };
  const update = (field: string, value: string | number | boolean) =>
    change({ ...config, [group]: { ...config[group], [field]: value } });
  const save = async (nextPresets = presets) => {
    setBusy(true);
    setError("");
    try {
      const doc = await api<AdminDocument>("admin/draft", {
        draft: config,
        presets: nextPresets,
      });
      setPresets(doc.presets);
      setDirty(false);
      setMessage("Draft saved. The visitor experience still uses Published.");
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ config: Effects; publishedAt: string }>(
        "admin/publish",
        { config },
      );
      setPublished(r.config);
      setPublishedAt(r.publishedAt);
      setMessage("Configuration published to this preview environment.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ version: 1, name: presetName, config }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "the-hub-effects.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importJson = async (file: File) => {
    try {
      if (file.size > 64000)
        throw new Error("Please choose a JSON file under 64 KB.");
      const raw = JSON.parse(await file.text());
      if (raw.version !== 1)
        throw new Error("Unsupported configuration version.");
      change(validateEffects(raw.config));
      if (typeof raw.name === "string") setPresetName(raw.name.slice(0, 60));
      setMessage("Configuration imported into Draft.");
    } catch (err) {
      setError((err as Error).message);
    }
  };
  const addPreset = async (duplicate = false) => {
    if (presets.length >= 30) {
      setError("You can save up to 30 presets.");
      return;
    }
    const name = (duplicate ? `${presetName} copy` : presetName)
      .trim()
      .slice(0, 60);
    if (!name) {
      setError("Give your preset a name.");
      return;
    }
    const next = [
      ...presets,
      { id: crypto.randomUUID(), name, config: structuredClone(config) },
    ];
    if (await save(next)) setMessage(`${name} saved to your presets.`);
  };
  const fullSequence = () => {
    if (sequenceTimer.current) clearTimeout(sequenceTimer.current);
    sim.reset();
    sequenceTimer.current = setTimeout(() => {
      sim.home();
      sequenceTimer.current = setTimeout(
        () => sim.start(),
        Math.max(
          500,
          (config.transition.duration * 1000) / config.motion.speed,
        ),
      );
    }, 900);
  };
  if (auth === "loading")
    return (
      <div className="auth-loading">
        <span className="loader" />
        Opening Effects Studio…
      </div>
    );
  if (auth === "signed-out") return <Login onLogin={() => setAuth("admin")} />;
  return (
    <div className="editor">
      <header className="studio-header">
        <a href="/ai" className="studio-brand">
          <span className="mini-hub">H.</span>
          <span>
            THE HUB <span className="slash">/</span>{" "}
            <strong>Effects Studio</strong>
          </span>
          <span className="phase-label">PHASE A</span>
        </a>
        <div className="studio-header-right">
          <span className="draft-label">
            <span />
            {dirty ? "Unsaved draft" : "Draft saved"}
          </span>
          <button
            className="studio-button"
            onClick={() => save()}
            disabled={busy}
          >
            <Save size={15} />
            Save draft
          </button>
          <button className="publish-button" onClick={publish} disabled={busy}>
            <ShieldCheck size={15} />
            Publish configuration
          </button>
          <button
            className="header-icon"
            aria-label="Sign out"
            onClick={async () => {
              try {
                await api("admin/logout", {});
                setAuth("signed-out");
                loaded.current = false;
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <div className="studio-layout">
        <aside className="inspector">
          <div className="inspector-title">
            <span>
              <SlidersHorizontal size={17} />
              The little details
            </span>
            <button
              className="icon-button"
              aria-label="Editor guide"
              onClick={() => setHelp(!help)}
            >
              <CircleHelp size={16} />
            </button>
          </div>
          <div className="preset-section">
            <div className="section-label">
              YOUR STARTING POINT <Sparkles size={12} />
            </div>
            <div className="preset-select">
              <select
                aria-label="Choose preset"
                defaultValue="signature"
                onChange={(e) => {
                  const item =
                    builtins.find(
                      (_, i) => `builtin-${i}` === e.target.value,
                    ) || presets.find((p) => p.id === e.target.value);
                  if (item) {
                    change(structuredClone(item.config));
                    setPresetName(item.name);
                  }
                }}
              >
                <option value="signature" disabled>
                  Choose a preset
                </option>
                <optgroup label="Made for The Hub">
                  {builtins.map((p, i) => (
                    <option key={p.name} value={`builtin-${i}`}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
                {presets.length > 0 && (
                  <optgroup label="Your saved presets">
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <ChevronDown size={14} />
            </div>
            <div className="preset-name">
              <input
                aria-label="Preset name"
                value={presetName}
                maxLength={60}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <button
                onClick={() => addPreset()}
                disabled={busy}
                title="Save as preset"
                aria-label="Save preset"
              >
                <Save size={14} />
              </button>
              <button
                onClick={() => addPreset(true)}
                disabled={busy}
                title="Duplicate preset"
                aria-label="Duplicate preset"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <nav className="effect-tabs" aria-label="Effects categories">
            {groups.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={group === id ? "selected" : ""}
                onClick={() => setGroup(id)}
              >
                <Icon size={16} />
                {label}
                {group === id && <span />}
              </button>
            ))}
          </nav>
          <div className="controls-heading">
            <h2>{groups.find((g) => g.id === group)?.label}</h2>
            <span>Make it yours. See it live.</span>
          </div>
          <div className="effect-fields">
            {fields[group].map((field) => {
              const value = (config[group] as Record<string, unknown>)[
                field.key
              ];
              const id = `setting-${group}-${field.key}`;
              return (
                <div
                  className={`effect-field field-${field.type || "range"}`}
                  key={id}
                >
                  <div className="field-label">
                    <label htmlFor={id}>{field.label}</label>
                    {!field.type && (
                      <div className="number-value">
                        <input
                          aria-label={`${field.label} value`}
                          type="number"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={value as number}
                          onChange={(e) => {
                            const n = e.currentTarget.valueAsNumber;
                            if (
                              Number.isFinite(n) &&
                              n >= field.min! &&
                              n <= field.max!
                            )
                              update(field.key, n);
                          }}
                        />
                        <span>{field.unit}</span>
                      </div>
                    )}
                  </div>
                  {field.type === "toggle" ? (
                    <button
                      id={id}
                      className={`toggle ${value ? "on" : ""}`}
                      role="switch"
                      aria-checked={value as boolean}
                      aria-label={field.label}
                      onClick={() => update(field.key, !value)}
                    >
                      <span />
                    </button>
                  ) : field.type === "color" ? (
                    <div className="color-control">
                      <input
                        id={id}
                        type="color"
                        value={value as string}
                        onChange={(e) => update(field.key, e.target.value)}
                      />
                      <span>{String(value).toUpperCase()}</span>
                      <span className="color-dot" />
                    </div>
                  ) : field.type === "select" ? (
                    <select
                      id={id}
                      value={String(value)}
                      onChange={(e) => update(field.key, e.target.value)}
                    >
                      {field.options?.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={value as number}
                      onChange={(e) =>
                        update(field.key, e.currentTarget.valueAsNumber)
                      }
                      style={
                        {
                          "--range-fill": `${(((value as number) - field.min!) / (field.max! - field.min!)) * 100}%`,
                        } as React.CSSProperties
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="inspector-footer">
            <button onClick={() => change(structuredClone(defaults))}>
              <RotateCcw size={14} />
              Reset to default
            </button>
            <div className="more-wrap">
              <button
                aria-label="Configuration actions"
                onClick={() => setMenu(!menu)}
              >
                <MoreHorizontal size={18} />
              </button>
              {menu && (
                <div className="more-menu">
                  <button
                    onClick={() => {
                      exportJson();
                      setMenu(false);
                    }}
                  >
                    <Download size={14} />
                    Export JSON
                  </button>
                  <button
                    onClick={() => {
                      imported.current?.click();
                      setMenu(false);
                    }}
                  >
                    <Upload size={14} />
                    Import JSON
                  </button>
                  <button
                    onClick={() => {
                      change(structuredClone(published));
                      setMenu(false);
                    }}
                  >
                    <RotateCcw size={14} />
                    Restore Published
                  </button>
                </div>
              )}
            </div>
            <input
              ref={imported}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importJson(file);
                e.target.value = "";
              }}
            />
          </div>
        </aside>
        <div className="studio-workspace">
          <div className="canvas-toolbar">
            <div className="canvas-label">
              <Eye size={15} />
              <strong>Live preview</strong>
              <span className="live-indicator" />{" "}
              <small>
                {viewPublished ? "Published" : "Draft"} configuration
              </small>
            </div>
            <div className="canvas-actions">
              <div className="viewport-buttons">
                {[
                  { id: "desktop", icon: Monitor },
                  { id: "portrait", icon: Maximize2 },
                  { id: "mobile", icon: Smartphone },
                ].map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    className={viewport === id ? "active" : ""}
                    onClick={() => setViewport(id)}
                    aria-label={`${id} preview`}
                    aria-pressed={viewport === id}
                  >
                    <Icon size={15} />
                  </button>
                ))}
              </div>
              <button
                className={`compare-button ${viewPublished ? "active" : ""}`}
                onClick={() => setViewPublished(!viewPublished)}
              >
                <Layers3 size={14} />
                {viewPublished ? "View draft" : "Compare published"}
              </button>
              <a
                href="/ai"
                target="_blank"
                rel="noreferrer"
                className="icon-button"
                aria-label="Open visitor preview"
              >
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
          <div className={`canvas-area viewport-${viewport}`}>
            <div className="preview-device">
              <Experience
                config={viewPublished ? published : config}
                sim={sim}
                embedded
              />
            </div>
            <span className="canvas-caption">
              <LockKeyhole size={10} />
              Preview only · No live microphone or paid AI calls
            </span>
          </div>
          <section
            className={`simulation-console ${timeline ? "" : "collapsed"}`}
            aria-label="Simulation controls"
          >
            <div className="console-title">
              <span>
                <FlaskConical size={16} />
                <strong>Simulation lab</strong>
                <span className="console-tag">MOCK AI</span>
              </span>
              <div>
                <button
                  className={`presence-button ${present ? "present" : ""}`}
                  onClick={() => {
                    setPresent(!present);
                    sim.log(
                      present
                        ? "Visitor left · simulated"
                        : "Visitor present · simulated",
                      "system",
                    );
                    if (present) sim.end();
                  }}
                >
                  <span />
                  {present ? "Visitor present" : "Visitor left"}
                </button>
                <button
                  className="icon-button"
                  onClick={() => setTimeline(!timeline)}
                  aria-label={
                    timeline ? "Collapse timeline" : "Expand timeline"
                  }
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
            <div className="playback-bar">
              <select
                aria-label="Simulation scenario"
                value={sim.scenario}
                onChange={(e) => {
                  sim.pause();
                  sim.setScenario(e.target.value as ScenarioId);
                }}
              >
                {Object.entries(scenarios).map(([id, s]) => (
                  <option key={id} value={id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <button
                className="play-button"
                onClick={() => {
                  if (sim.playing) sim.pause();
                  else if (sim.cursor < 0) sim.start();
                  else sim.resume();
                }}
                aria-label={sim.playing ? "Pause demo" : "Play demo"}
              >
                {sim.playing ? <Pause size={14} /> : <Play size={14} />}{" "}
                {sim.playing ? "Pause" : "Play"}
              </button>
              <button
                className="icon-button"
                onClick={() => sim.start()}
                aria-label="Replay scenario"
              >
                <RotateCcw size={15} />
              </button>
              <button
                className="icon-button"
                onClick={sim.step}
                disabled={sim.cursor < 0 || sim.cursor >= sim.total - 1}
                aria-label="Next simulation step"
              >
                <SkipForward size={16} />
              </button>
              <span className="playback-divider" />
              <button className="sequence-button" onClick={fullSequence}>
                <Film size={14} />
                Full sequence
              </button>
              <button
                className="sequence-button"
                onClick={() => {
                  sim.reset();
                }}
              >
                <RotateCcw size={13} />
                Reset
              </button>
              <span className="state-tag">{sim.state}</span>
            </div>
            {timeline && (
              <>
                <div className="state-shortcuts">
                  {[
                    { label: "Welcome", action: () => sim.force("WELCOME") },
                    { label: "Home", action: () => sim.home() },
                    { label: "Start session", action: () => sim.start() },
                    {
                      label: "Listening",
                      action: () => sim.force("LISTENING"),
                    },
                    { label: "Thinking", action: () => sim.force("THINKING") },
                    { label: "Speaking", action: () => sim.force("SPEAKING") },
                    { label: "Show tours", action: () => sim.showTours() },
                    { label: "Tour details", action: sim.showDetails },
                    { label: "Return to orb", action: sim.returnOrb },
                    { label: "End session", action: sim.end },
                  ].map((s) => (
                    <button key={s.label} onClick={s.action}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <div
                  className="timeline-events"
                  role="log"
                  aria-label="Event timeline"
                >
                  {sim.logs.length ? (
                    sim.logs
                      .slice(-6)
                      .reverse()
                      .map((l) => (
                        <div key={l.id} className={`event event-${l.kind}`}>
                          <time>{(l.time / 1000).toFixed(1)}s</time>
                          <span className="event-dot" />
                          <span>{l.label}</span>
                          <small>{l.kind}</small>
                        </div>
                      ))
                  ) : (
                    <div className="timeline-empty">
                      <span className="timeline-line" />
                      <p>
                        Every little move, in one place.{" "}
                        <span>Play a scenario to see the story unfold.</span>
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
      <footer className="studio-status">
        <span>
          <Check size={11} />
          All changes preview instantly
        </span>
        <span>
          {publishedAt
            ? `Published ${new Date(publishedAt).toLocaleString()}`
            : "No published configuration yet"}
          <span className="status-sep">·</span>THE HUB / PREVIEW ENVIRONMENT
        </span>
      </footer>
      {(message || error) && (
        <div
          className={`editor-toast ${error ? "error" : ""}`}
          role={error ? "alert" : "status"}
        >
          <span>{error || message}</span>
          <button
            onClick={() => {
              setMessage("");
              setError("");
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      {help && (
        <div className="help-overlay" onClick={() => setHelp(false)}>
          <section
            className="help-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="eyebrow">A LITTLE CREATIVE GUIDANCE</span>
            <h2 id="help-title">Your Effects Studio.</h2>
            <p>
              Choose a category, then adjust a slider, color, or switch. The
              canvas updates immediately.
            </p>
            <ol>
              <li>
                <strong>Preview the moment.</strong> Use Welcome, Home, voice
                states, or Show tours. Replay a scenario or run the full
                sequence.
              </li>
              <li>
                <strong>Keep your favorites.</strong> Name a preset and save or
                duplicate it. Import and export validated JSON from the •••
                menu.
              </li>
              <li>
                <strong>Save your draft.</strong> Browser drafts recover
                locally. Save Draft keeps it on the server.
              </li>
              <li>
                <strong>Publish when ready.</strong> Only signed-in admins can
                publish. This updates the isolated preview’s visitor experience;
                it never changes The Hub production websites.
              </li>
            </ol>
            <p className="sample-note">
              Published settings may take up to a minute to reach every edge
              location. Reload the visitor tab to see the latest configuration.
            </p>
            <button className="primary-button" onClick={() => setHelp(false)}>
              Back to creating <ArrowRight size={16} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
