export const states = [
  "WELCOME",
  "HOME",
  "SESSION_STARTING",
  "LISTENING",
  "THINKING",
  "SPEAKING",
  "SHOWING_CONTENT",
  "SESSION_ENDING",
] as const;
export type State = (typeof states)[number];
export type OrbState =
  "IDLE" | "LISTENING" | "THINKING" | "SPEAKING" | "TRANSITIONING";
export const transitions: Record<State, readonly State[]> = {
  WELCOME: ["HOME"],
  HOME: ["WELCOME", "SESSION_STARTING"],
  SESSION_STARTING: ["LISTENING", "SESSION_ENDING"],
  LISTENING: ["THINKING", "SESSION_ENDING"],
  THINKING: ["SPEAKING", "SESSION_ENDING"],
  SPEAKING: ["LISTENING", "SHOWING_CONTENT", "SESSION_ENDING"],
  SHOWING_CONTENT: ["LISTENING", "THINKING", "SPEAKING", "SESSION_ENDING"],
  SESSION_ENDING: ["WELCOME"],
};
export function transition(from: State, to: State): State {
  if (from === to) return from;
  if (!transitions[from].includes(to))
    throw new Error(`Invalid transition: ${from} → ${to}`);
  return to;
}
export function orbState(state: State): OrbState {
  return state === "LISTENING" || state === "THINKING" || state === "SPEAKING"
    ? state
    : state === "SESSION_STARTING" || state === "SESSION_ENDING"
      ? "TRANSITIONING"
      : "IDLE";
}
export type TimelineEvent = {
  id: string;
  time: number;
  label: string;
  kind: "state" | "customer" | "agent" | "function" | "system";
};
export const amplitude = (time: number, state: OrbState) =>
  state === "SPEAKING"
    ? Math.max(
        0,
        Math.sin(time * 8) * 0.35 + Math.sin(time * 13.7) * 0.25 + 0.4,
      )
    : state === "LISTENING"
      ? (Math.sin(time * 5) + 1) * 0.24
      : 0.035;
