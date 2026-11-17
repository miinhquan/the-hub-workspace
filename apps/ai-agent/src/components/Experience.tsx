import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  AudioLines,
  Check,
  ChevronDown,
  Compass,
  Globe2,
  Maximize,
  Mic,
  MicOff,
  Minimize,
  PhoneOff,
  Settings2,
  Shirt,
  Sparkles,
  TrainFront,
  Wifi,
  X,
} from "lucide-react";
import type { CSSProperties } from "react";
import type { MouseEvent } from "react";
import type { Effects } from "../config";
import type { Simulation } from "../engine/useSimulation";
import { orbState } from "../engine/machine";
import { scenarios, type ScenarioId } from "../engine/providers";
import { TourCards } from "./TourCards";
const Orb = lazy(() => import("./Orb"));
export function Brand() {
  return (
    <a href="/ai" className="brand" aria-label="The Hub — home">
      <img src="/images/the-hub-logo.webp" alt="The Hub" />
      <span>LAUNDROMAT & TRAVEL</span>
    </a>
  );
}
const topics = [
  {
    icon: Compass,
    title: "Explore Vietnam",
    subtitle: "Find your next adventure",
    scenario: "halong",
  },
  {
    icon: Shirt,
    title: "Laundry assistance",
    subtitle: "A fresh start, made easy",
    scenario: "laundry",
  },
  {
    icon: TrainFront,
    title: "Bus & train tickets",
    subtitle: "Keep your journey moving",
    scenario: "tickets",
  },
  {
    icon: Wifi,
    title: "SIM & eSIM",
    subtitle: "Stay connected along the way",
    scenario: "sim",
  },
];
export function Experience({
  config,
  sim,
  embedded = false,
}: {
  config: Effects;
  sim: Simulation;
  embedded?: boolean;
}) {
  const prefersReduced = useReducedMotion(),
    reduced = config.motion.reduced || !!prefersReduced;
  const [entering, setEntering] = useState(false),
    [muted, setMuted] = useState(false),
    [fullscreen, setFullscreen] = useState(false),
    [notice, setNotice] = useState(""),
    [lang, setLang] = useState("en"),
    [showLanguages, setShowLanguages] = useState(false),
    [origin, setOrigin] = useState({ x: 0, y: 0, width: 266, height: 266 });
  const root = useRef<HTMLDivElement>(null);
  const go = sim.go;
  const welcome = sim.state === "WELCOME",
    home = sim.state === "HOME",
    active = !welcome && !home;
  const speed = config.motion.speed,
    respond = config.motion.responsiveness;
  const duration = reduced ? 0.01 : config.transition.duration / speed;
  useEffect(() => {
    const update = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timeout);
  }, [notice]);
  const start = (event: MouseEvent<HTMLButtonElement>) => {
    if (entering) return;
    const rect = event.currentTarget.getBoundingClientRect(),
      parent = root.current!.getBoundingClientRect();
    setOrigin({
      x: rect.left + rect.width / 2 - parent.left,
      y: rect.top + rect.height / 2 - parent.top,
      width: rect.width,
      height: rect.height,
    });
    setEntering(true);
  };
  useEffect(() => {
    if (!entering) return;
    const timer = setTimeout(
      () => go("HOME"),
      duration * 1000 * config.transition.fade,
    );
    return () => clearTimeout(timer);
  }, [entering, duration, config.transition.fade, go]);
  const inquiry = () => {
    sim.log("create_inquiry · simulated, no external write", "function");
    setNotice("Demo inquiry prepared. Nothing has been sent or booked.");
  };
  const topic = (id: string) => {
    if (id === "tickets" || id === "sim") {
      sim.start("laundry");
      sim.pause();
      sim.force("LISTENING");
      setNotice(
        id === "tickets"
          ? "Our team can help arrange your next connection. Ticket booking will be connected in Phase B."
          : "Ask our team at the counter about SIM and eSIM options. Live assistance will be connected in Phase B.",
      );
      return;
    }
    sim.start(id as ScenarioId);
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setNotice(
        "Fullscreen is unavailable in this browser. Open the preview in its own tab.",
      );
    }
  };
  const labels =
    lang === "fr"
      ? {
          hello: "Un peu de savoir local.",
          line: "Tout un monde à découvrir.",
          start: "Parler avec notre Agent",
        }
      : lang === "vi"
        ? {
            hello: "Một chút am hiểu địa phương.",
            line: "Mở ra những hành trình mới.",
            start: "Bắt đầu trò chuyện với Agent",
          }
        : {
            hello: "A little local knowledge.",
            line: "A world of possibilities.",
            start: "Start talking with our Agent",
          };
  const w = config.welcome,
    t = config.transition;
  const screenStyle = {
    "--brand": config.orb.primary,
    "--ui-speed": `${0.25 / respond}s`,
    "--ambient-duration": `${22 / speed}s`,
    "--welcome-glow": w.glow,
    "--welcome-shadow": w.shadow,
  } as CSSProperties;
  return (
    <div
      ref={root}
      className={`experience ${embedded ? "embedded" : ""} ${reduced ? "reduced-motion" : ""} ${!config.motion.background ? "still-background" : ""}`}
      style={screenStyle}
    >
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="grain" />
      <header className="experience-header">
        <Brand />
        <div className="header-actions">
          <span className="simulation-badge">
            <span />
            Simulation mode
          </span>
          <div className="language-control">
            <button
              className="language-button"
              onClick={() => setShowLanguages((x) => !x)}
              aria-expanded={showLanguages}
              aria-label="Choose language"
            >
              <Globe2 size={15} />
              {lang === "en" ? "EN" : lang === "fr" ? "FR" : "VI"}
              <ChevronDown size={12} />
            </button>
            {showLanguages && (
              <div className="language-menu glass">
                {[
                  ["en", "English"],
                  ["fr", "Français"],
                  ["vi", "Tiếng Việt"],
                ].map(([id, title]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setLang(id);
                      setShowLanguages(false);
                    }}
                  >
                    {title}
                    {lang === id && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!embedded && (
            <button
              className="icon-button fullscreen-button"
              onClick={toggleFullscreen}
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>
          )}
        </div>
      </header>
      <main className={`experience-main ${sim.content ? "has-content" : ""}`}>
        <AnimatePresence mode="wait">
          {welcome && (
            <motion.section
              key="welcome"
              className="welcome-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.01 : 0.35 }}
            >
              <span className="eyebrow welcome-eyebrow">
                <span className="little-spark" />
                YOUR HANOI ADVENTURE STARTS HERE
              </span>
              <h1>
                Fresh clothes.
                <br />
                <span>New adventures.</span>
              </h1>
              <p>
                A friendly local. A fresh perspective.
                <br />
                Make yourself at home at The Hub.
              </p>
              <div className="start-button-wrap">
                <div className="welcome-orbit orbit-one" />
                <div className="welcome-orbit orbit-two" />
                <motion.button
                  className="welcome-button"
                  onClick={start}
                  aria-label="Tap to Start"
                  disabled={entering}
                  style={{
                    width: w.size,
                    height: w.size,
                    borderRadius: w.radius,
                    background: `linear-gradient(145deg,rgba(255,255,255,${Math.min(1, w.opacity + 0.3)}),rgba(231,243,255,${w.opacity}))`,
                    backdropFilter: `blur(${w.blur}px)`,
                    borderColor: `rgba(255,255,255,${w.border})`,
                    boxShadow: `inset 0 1px 2px #fff,0 ${12 + w.shadow * 25}px ${35 + w.shadow * 60}px -28px rgba(5,70,172,${w.shadow}),0 0 ${w.glow * 100}px rgba(133,193,251,${w.glow * 0.35})`,
                  }}
                  animate={
                    !reduced && w.idle && !entering
                      ? { y: [0, -6, 0] }
                      : { y: 0 }
                  }
                  transition={{
                    duration: 4 / speed,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileHover={reduced ? {} : { scale: w.hover }}
                  whileTap={reduced ? {} : { scale: w.press }}
                >
                  <span className="button-spark">
                    <Sparkles size={27} strokeWidth={1.3} />
                  </span>
                  <span className="start-label">Tap to Start</span>
                  <span className="start-arrow">
                    <ArrowRight size={20} />
                  </span>
                  <span className="button-reflection" />
                </motion.button>
              </div>
              <span className="welcome-footnote">
                A little help for wherever life takes you.
              </span>
            </motion.section>
          )}
          {home && (
            <motion.section
              key="home"
              className="home-screen"
              initial={{ opacity: 1 - config.motion.fade, y: reduced ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, filter: `blur(${reduced ? 0 : 8}px)` }}
              transition={{ duration: reduced ? 0.01 : 0.6 / speed }}
            >
              <span className="eyebrow">
                <span className="little-spark" />
                HELLO, TRAVELER. YOU’RE IN GOOD COMPANY.
              </span>
              <div className="home-orb-small">
                <Suspense fallback={<div className="orb-loading" />}>
                  <Orb
                    config={config.orb}
                    state="IDLE"
                    reduced={reduced}
                    speed={speed}
                  />
                </Suspense>
              </div>
              <h1>
                {labels.hello}
                <br />
                <span>{labels.line}</span>
              </h1>
              <p>
                From your next adventure to your next laundry load.
                <br />
                Let’s make your time in Vietnam a little easier.
              </p>
              <motion.button
                className="primary-button start-talking"
                onClick={() => sim.start()}
                whileHover={reduced ? {} : { y: -3 }}
                whileTap={{ scale: 0.97 }}
              >
                <AudioLines size={21} />
                {labels.start}
                <ArrowRight size={19} />
              </motion.button>
              <span className="mock-note">
                A preview conversation · Your microphone stays off
              </span>
              <div className="topic-grid">
                {topics.map(({ icon: Icon, title, subtitle, scenario }) => (
                  <button
                    className="topic-card glass"
                    key={title}
                    onClick={() => topic(scenario)}
                  >
                    <span className="topic-icon">
                      <Icon size={20} strokeWidth={1.5} />
                    </span>
                    <span>
                      <strong>{title}</strong>
                      <small>{subtitle}</small>
                    </span>
                    <ArrowRight className="topic-arrow" size={16} />
                  </button>
                ))}
              </div>
              <button
                className="text-button ask-anything"
                onClick={() => {
                  sim.start("language");
                }}
              >
                Or just ask us anything <ArrowRight size={14} />
              </button>
            </motion.section>
          )}
          {active && (
            <motion.section
              key="session"
              className={`session-screen ${sim.content ? "with-tours" : ""}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence>
                {sim.content && (
                  <TourCards
                    key="tours"
                    config={config.cards}
                    detailRequest={sim.detailRequest}
                    destination={sim.destination}
                    reduced={reduced}
                    speed={speed}
                    onBack={sim.returnOrb}
                    onDetails={(id) =>
                      sim.log(`view_tour_details(${id})`, "function")
                    }
                    onInquiry={inquiry}
                  />
                )}
              </AnimatePresence>
              <motion.div
                layout
                className="conversation-focus"
                transition={
                  reduced
                    ? { duration: 0.01 }
                    : { type: "spring", stiffness: 75, damping: 20 }
                }
              >
                <AnimatePresence>
                  {!sim.content && (
                    <motion.div
                      className="conversation-intro"
                      exit={{ opacity: 0 }}
                    >
                      <span className="eyebrow">
                        A LOCAL FRIEND, WHEREVER YOU’RE HEADED
                      </span>
                      <h1>
                        Let’s find your next <span>great story.</span>
                      </h1>
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div
                  layout
                  className="orb-stage"
                  style={{
                    width: sim.content ? 128 : config.orb.size,
                    height: sim.content ? 128 : config.orb.size,
                    marginTop: config.orb.position,
                  }}
                  transition={
                    reduced
                      ? { duration: 0.01 }
                      : { type: "spring", stiffness: 65, damping: 18 }
                  }
                >
                  <Suspense fallback={<div className="orb-loading" />}>
                    <Orb
                      config={config.orb}
                      state={orbState(sim.state)}
                      muted={muted}
                      reduced={reduced}
                      speed={speed}
                    />
                  </Suspense>
                </motion.div>
                <div
                  className="voice-copy"
                  aria-live="polite"
                  lang={sim.language}
                >
                  <span
                    className={`voice-state state-${sim.state.toLowerCase()}`}
                  >
                    <span />
                    {sim.state === "LISTENING"
                      ? "Listening to a simulated voice"
                      : sim.state === "THINKING"
                        ? "A little local thinking…"
                        : sim.state === "SPEAKING"
                          ? "Your Agent is speaking"
                          : sim.state === "SHOWING_CONTENT"
                            ? "A little inspiration for you"
                            : sim.state === "SESSION_ENDING"
                              ? "Until the next adventure"
                              : "Getting comfortable…"}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={sim.text}
                      initial={{ opacity: 0, y: reduced ? 0 : 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduced ? 0.01 : 0.3 / speed }}
                    >
                      {sim.text ||
                        "Your next adventure is a conversation away."}
                    </motion.p>
                  </AnimatePresence>
                  {sim.inquiry && (
                    <span className="inquiry-note">
                      <Check size={13} />
                      Demo inquiry prepared · Nothing sent
                    </span>
                  )}
                </div>
              </motion.div>
              <div className="session-controls">
                <button
                  className={`icon-button voice-control ${muted ? "muted" : ""}`}
                  onClick={() => {
                    setMuted(!muted);
                    sim.log(
                      !muted
                        ? "Simulated mute enabled"
                        : "Simulated mute disabled",
                      "system",
                    );
                  }}
                  aria-label={
                    muted ? "Unmute simulated voice" : "Mute simulated voice"
                  }
                  aria-pressed={muted}
                >
                  {muted ? <MicOff size={19} /> : <Mic size={19} />}
                </button>
                <span className="control-separator" />
                <button className="end-button" onClick={sim.end}>
                  <PhoneOff size={17} />
                  End conversation
                </button>
              </div>
              {!sim.content && (
                <div className="prompt-pills">
                  {(Object.keys(scenarios) as ScenarioId[]).map((id) => (
                    <button key={id} onClick={() => sim.start(id)}>
                      {scenarios[id].title}
                      <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              )}
              <span className="session-disclaimer">
                Simulation preview · No microphone, recording, or live booking
              </span>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
      <footer className="experience-footer">
        <span>
          <span className="location-dot" />
          48 Thuốc Bắc, Hanoi Old Quarter
        </span>
        <span className="brand-tagline">FRESH CLOTHES FOR EVERY JOURNEY</span>
        {!embedded ? (
          <a href="/ai/admin/effects" className="studio-link">
            <Settings2 size={14} />
            Effects Studio
            <ArrowRight size={13} />
          </a>
        ) : (
          <span className="studio-link">LIVE PREVIEW</span>
        )}
      </footer>
      <AnimatePresence>
        {entering && (
          <motion.div
            className="glass-transition"
            style={{
              left: origin.x,
              top: origin.y,
              marginLeft: -origin.width / 2,
              marginTop: -origin.height / 2,
              width: origin.width,
              height: origin.height,
              borderRadius: w.radius,
              backdropFilter: `blur(${w.blur}px)`,
              background: t.background
                ? "rgba(235,246,255,.75)"
                : "rgba(255,255,255,.18)",
            }}
            initial={{ scale: t.initialScale, opacity: 1 }}
            animate={{
              scale: t.finalScale,
              opacity: [1, 1, 0],
              filter: [`blur(0px)`, `blur(${t.blur * 18}px)`, `blur(0px)`],
            }}
            transition={{
              duration,
              ease:
                t.easing === "fluid"
                  ? [0.22, 1, 0.36, 1]
                  : t.easing === "spring"
                    ? "backOut"
                    : "easeInOut",
              opacity: { times: [0, t.fade, 1], duration },
              scale:
                t.easing === "spring"
                  ? {
                      type: "spring",
                      stiffness: t.stiffness,
                      damping: t.damping,
                      duration,
                    }
                  : undefined,
            }}
            onAnimationComplete={() => {
              setEntering(false);
              if (sim.state === "WELCOME") sim.go("HOME");
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {notice && (
          <motion.div
            role="status"
            className="toast glass"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Check size={16} />
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
