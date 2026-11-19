import { describe, expect, it } from "vitest";
import { defaults, fields, validateEffects, type Group } from "../src/config";
import {
  amplitude,
  transition,
  transitions,
  type State,
} from "../src/engine/machine";
import {
  MockProvider,
  MockTourProvider,
  scenarios,
  type ScenarioId,
} from "../src/engine/providers";
describe("Effects configuration boundary", () => {
  it("round-trips all defaults and prevents shared mutation", () => {
    const copy = validateEffects(JSON.parse(JSON.stringify(defaults)));
    expect(copy).toEqual(defaults);
    copy.orb.size = 200;
    expect(defaults.orb.size).toBe(330);
  });
  it("rejects missing groups, NaN, unsafe colors and invalid enums", () => {
    for (const bad of [
      null,
      [],
      {},
      { ...defaults, orb: { ...defaults.orb, size: Infinity } },
      {
        ...defaults,
        orb: { ...defaults.orb, primary: "url(javascript:alert(1))" },
      },
      {
        ...defaults,
        transition: { ...defaults.transition, easing: "unknown" },
      },
    ])
      expect(() => validateEffects(bad)).toThrow();
  });
  it("enforces every numeric bound", () => {
    for (const group of Object.keys(fields) as Group[])
      for (const f of fields[group])
        if (!f.type) {
          const input = structuredClone(defaults);
          (input[group] as Record<string, unknown>)[f.key] = f.max! + 1;
          expect(() => validateEffects(input)).toThrow(
            `Invalid ${group}.${f.key}`,
          );
        }
  });
  it("drops unknown keys from imported documents", () => {
    expect(
      validateEffects({ ...defaults, unknown: "data" }),
    ).not.toHaveProperty("unknown");
  });
});
describe("Conversation machine and providers", () => {
  it("Tap to Start only opens Home", () => {
    expect(transition("WELCOME", "HOME")).toBe("HOME");
    expect(() => transition("WELCOME", "LISTENING")).toThrow();
    expect(() => transition("HOME", "SPEAKING")).toThrow();
  });
  it("all predefined scenarios follow legal transitions", () => {
    const provider = new MockProvider();
    for (const id of Object.keys(scenarios) as ScenarioId[]) {
      let state: State = "HOME";
      for (const step of provider.scenario(id))
        if (step.state) state = transition(state, step.state);
      expect(transitions[state]).toContain("SESSION_ENDING");
    }
  });
  it("simulates functions without external side effects", () => {
    const p = new MockProvider();
    expect(p.mode).toBe("simulation");
    expect(p.scenario("hagiang").some((s) => s.call === "create_inquiry")).toBe(
      true,
    );
    expect(
      p
        .scenario("language")
        .filter((s) => s.call === "switch_language")
        .map((s) => s.language),
    ).toEqual(["fr", "vi"]);
  });
  it("keeps simulated amplitude bounded", () => {
    for (let t = 0; t < 100; t += 0.07) {
      expect(amplitude(t, "SPEAKING")).toBeGreaterThanOrEqual(0);
      expect(amplitude(t, "SPEAKING")).toBeLessThanOrEqual(1);
    }
  });
  it("filters mock tours without inventing price or availability", async () => {
    const p = new MockTourProvider(),
      all = await p.list();
    expect(all).toHaveLength(4);
    expect(await p.list("hagiang")).toHaveLength(1);
    expect(await p.list("missing")).toEqual([]);
    for (const tour of all) {
      expect(tour.duration).toMatch("Sample");
      expect(tour).not.toHaveProperty("price");
      expect(tour).not.toHaveProperty("availability");
    }
  });
});
