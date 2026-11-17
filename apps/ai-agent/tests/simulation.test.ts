// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSimulation } from "../src/engine/useSimulation";
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe("Simulation playback lifecycle", () => {
  it("opens Home without starting a session or playback", () => {
    const { result } = renderHook(() => useSimulation());
    act(() => result.current.go("HOME"));
    expect(result.current.state).toBe("HOME");
    expect(result.current.playing).toBe(false);
    expect(result.current.cursor).toBe(-1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("pauses with the remaining delay and resumes exactly once", () => {
    const { result } = renderHook(() => useSimulation());
    act(() => result.current.start("halong"));
    act(() => vi.advanceTimersByTime(300));
    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.state).toBe("SESSION_STARTING");
    act(() => result.current.resume());
    act(() => vi.advanceTimersByTime(350));
    expect(result.current.state).toBe("LISTENING");
    expect(result.current.cursor).toBe(1);
  });
  it("cleans all pending timers on reset and unmount", () => {
    const { result, unmount } = renderHook(() => useSimulation());
    act(() => result.current.start());
    act(() => result.current.reset());
    act(() => vi.runAllTimers());
    expect(result.current.state).toBe("WELCOME");
    expect(result.current.content).toBe(false);
    act(() => result.current.start());
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("changing scenario discards the old paused sequence", () => {
    const { result } = renderHook(() => useSimulation());
    act(() => result.current.start("halong"));
    act(() => vi.advanceTimersByTime(700));
    act(() => result.current.setScenario("hagiang"));
    expect(result.current.cursor).toBe(-1);
    expect(result.current.playing).toBe(false);
    act(() => result.current.resume());
    expect(result.current.scenario).toBe("hagiang");
    expect(result.current.cursor).toBe(0);
  });
  it("steps manually without scheduling an autoplay timer", () => {
    const { result } = renderHook(() => useSimulation());
    act(() => result.current.start());
    act(() => result.current.pause());
    act(() => result.current.step());
    expect(result.current.state).toBe("LISTENING");
    expect(result.current.playing).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("supports tour display from session-starting and visitor departure", () => {
    const { result } = renderHook(() => useSimulation());
    act(() => result.current.start());
    act(() => result.current.showTours());
    expect(result.current.state).toBe("SHOWING_CONTENT");
    expect(result.current.content).toBe(true);
    act(() => result.current.end());
    expect(result.current.state).toBe("SESSION_ENDING");
    act(() => vi.advanceTimersByTime(900));
    expect(result.current.state).toBe("WELCOME");
  });
  it("replaying cancels the previous scenario instead of interleaving", () => {
    const { result } = renderHook(() => useSimulation());
    act(() => result.current.start("halong"));
    act(() => vi.advanceTimersByTime(600));
    act(() => result.current.start("laundry"));
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.state).toBe("SESSION_STARTING");
    expect(result.current.scenario).toBe("laundry");
    expect(vi.getTimerCount()).toBe(1);
  });
});
