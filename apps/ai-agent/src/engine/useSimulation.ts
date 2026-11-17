import { useCallback, useEffect, useRef, useState } from "react";
import { MockProvider, type ScenarioId, type Step } from "./providers";
import { transition, type State, type TimelineEvent } from "./machine";
export function useSimulation() {
  const [state, setState] = useState<State>("WELCOME");
  const [scenario, selectScenario] = useState<ScenarioId>("halong");
  const [playing, setPlaying] = useState(false);
  const [text, setText] = useState("");
  const [customer, setCustomer] = useState("");
  const [destination, setDestination] = useState("all");
  const [content, setContent] = useState(false);
  const [inquiry, setInquiry] = useState(false);
  const [language, setLanguage] = useState("en");
  const [logs, setLogs] = useState<TimelineEvent[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [playbackId, setPlaybackId] = useState(0);
  const [detailRequest, setDetailRequest] = useState(0);
  const current = useRef<State>("WELCOME");
  const sequence = useRef<readonly Step[]>([]);
  const epoch = useRef(Date.now());
  const provider = useRef(new MockProvider());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const due = useRef(0),
    remaining = useRef(0);
  const log = useCallback(
    (label: string, kind: TimelineEvent["kind"] = "state") =>
      setLogs((l) => [
        ...l.slice(-99),
        {
          id: crypto.randomUUID(),
          time: Date.now() - epoch.current,
          label,
          kind,
        },
      ]),
    [],
  );
  const go = useCallback(
    (to: State) => {
      const from = current.current;
      transition(from, to);
      current.current = to;
      setState(to);
      if (from !== to) log(`${from} → ${to}`);
    },
    [log],
  );
  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  const apply = useCallback(
    (step: Step) => {
      if (step.state) go(step.state);
      if (step.text) {
        setText(step.text);
        log(step.text, "agent");
      }
      if (step.customer) {
        setCustomer(step.customer);
        log(step.customer, "customer");
      }
      if (step.language) setLanguage(step.language);
      if (step.call) {
        log(
          `${step.call}(${step.destination || step.language || "2 travelers"}) · simulated`,
          "function",
        );
        if (step.call === "show_tours") {
          setContent(true);
          setDestination(step.destination || "all");
        }
        if (step.call === "create_inquiry") setInquiry(true);
      }
    },
    [go, log],
  );
  const reset = useCallback(() => {
    clear();
    setPlaying(false);
    sequence.current = [];
    setCursor(-1);
    setDetailRequest(0);
    setText("");
    setCustomer("");
    setContent(false);
    setInquiry(false);
    setLanguage("en");
    remaining.current = 0;
    // A reset is an explicit machine interruption, not a fabricated conversation transition.
    current.current = "WELCOME";
    setState("WELCOME");
    log("RESET → WELCOME", "system");
  }, [clear, log]);
  const home = useCallback(() => {
    reset();
    go("HOME");
  }, [go, reset]);
  const start = useCallback(
    (id: ScenarioId = scenario) => {
      clear();
      setPlaybackId((n) => n + 1);
      setDetailRequest(0);
      selectScenario(id);
      setContent(false);
      setInquiry(false);
      setText("");
      setCustomer("");
      setLanguage("en");
      epoch.current = Date.now();
      setLogs([]);
      if (current.current !== "HOME") {
        current.current = "WELCOME";
        setState("WELCOME");
        go("HOME");
      }
      sequence.current = provider.current.scenario(id);
      remaining.current = 0;
      setCursor(0);
      apply(sequence.current[0]);
      setPlaying(true);
    },
    [scenario, clear, go, apply],
  );
  useEffect(() => {
    if (!playing || cursor < 0) return;
    const step = sequence.current[cursor];
    if (!step) return;
    const delay = remaining.current || step.delay;
    remaining.current = 0;
    due.current = Date.now() + delay;
    timer.current = setTimeout(() => {
      timer.current = null;
      const next = cursor + 1;
      if (next < sequence.current.length) {
        apply(sequence.current[next]);
        setCursor(next);
      } else {
        setPlaying(false);
        log("Scenario complete", "system");
      }
    }, delay);
    return clear;
  }, [playing, cursor, playbackId, apply, clear, log]);
  const pause = useCallback(() => {
    remaining.current = Math.max(1, due.current - Date.now());
    clear();
    setPlaying(false);
    log("Playback paused", "system");
  }, [clear, log]);
  const resume = useCallback(() => {
    if (
      cursor < 0 ||
      (cursor >= sequence.current.length - 1 && remaining.current === 0)
    )
      start();
    else setPlaying(true);
  }, [cursor, start]);
  const step = useCallback(() => {
    clear();
    setPlaying(false);
    remaining.current = 0;
    const n = cursor + 1;
    if (n >= sequence.current.length) return;
    if (n < 0) return;
    apply(sequence.current[n]);
    setCursor(n);
  }, [clear, cursor, apply]);
  const stop = useCallback(() => {
    clear();
    setPlaying(false);
    remaining.current = 0;
  }, [clear]);
  const setScenario = useCallback(
    (id: ScenarioId) => {
      stop();
      selectScenario(id);
      sequence.current = [];
      setCursor(-1);
    },
    [stop],
  );
  const force = useCallback(
    (to: State) => {
      stop();
      current.current = to;
      setState(to);
      log(`Manual preview → ${to}`, "system");
      if (to === "SHOWING_CONTENT") {
        setContent(true);
        setDestination("all");
      } else if (to === "WELCOME" || to === "HOME") setContent(false);
    },
    [stop, log],
  );
  const end = useCallback(() => {
    stop();
    if (current.current === "HOME" || current.current === "WELCOME") {
      reset();
      return;
    }
    go("SESSION_ENDING");
    setContent(false);
    setText("See you on your next adventure.");
    timer.current = setTimeout(reset, 850);
  }, [go, reset, stop]);
  const showTours = useCallback(
    (dest = "all") => {
      stop();
      if (current.current === "WELCOME" || current.current === "HOME") {
        current.current = "SPEAKING";
        setState("SPEAKING");
        log("Manual simulation session started", "system");
      }
      if (current.current === "SESSION_ENDING") {
        current.current = "HOME";
        setState("HOME");
      }
      if (current.current === "SESSION_STARTING") go("LISTENING");
      if (current.current === "HOME") go("SESSION_STARTING");
      if (current.current === "SESSION_STARTING") go("LISTENING");
      if (current.current === "LISTENING") go("THINKING");
      if (current.current === "THINKING") go("SPEAKING");
      go("SHOWING_CONTENT");
      setDestination(dest);
      setContent(true);
      setText("A little inspiration for your journey.");
      log(`show_tours(${dest}) · simulated`, "function");
    },
    [stop, go, log],
  );
  const showDetails = useCallback(() => {
    showTours();
    setDetailRequest((n) => n + 1);
  }, [showTours]);
  const returnOrb = useCallback(() => {
    stop();
    setContent(false);
    if (current.current === "SHOWING_CONTENT" || current.current === "SPEAKING")
      go("LISTENING");
    setText("Where would you like to go next?");
  }, [go, stop]);
  useEffect(
    () => () => {
      clear();
      provider.current.dispose();
    },
    [clear],
  );
  return {
    state,
    scenario,
    setScenario,
    playing,
    text,
    customer,
    destination,
    content,
    inquiry,
    language,
    logs,
    cursor,
    detailRequest,
    showDetails,
    total: sequence.current.length,
    go,
    home,
    start,
    pause,
    resume,
    step,
    reset,
    end,
    force,
    showTours,
    returnOrb,
    log,
  };
}
export type Simulation = ReturnType<typeof useSimulation>;
