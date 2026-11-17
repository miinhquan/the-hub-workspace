export const defaults = {
  welcome: {
    size: 266,
    radius: 56,
    opacity: 0.36,
    blur: 24,
    border: 0.8,
    glow: 0.3,
    shadow: 0.25,
    hover: 1.04,
    press: 0.94,
    idle: true,
  },
  transition: {
    duration: 1.25,
    initialScale: 0.96,
    finalScale: 14,
    stiffness: 85,
    damping: 20,
    fade: 0.42,
    blur: 0.5,
    background: true,
    easing: "fluid",
  },
  orb: {
    size: 330,
    position: 0,
    primary: "#0546ac",
    secondary: "#7bdcff",
    glow: 0.55,
    distortion: 0.38,
    noise: 0.48,
    speed: 0.55,
    pulse: 0.55,
    sensitivity: 1,
    rotation: 0.22,
    blur: 0,
    opacity: 1,
    listening: true,
    thinking: true,
    speaking: true,
  },
  cards: {
    width: 286,
    height: 378,
    radius: 26,
    gap: 18,
    imageScale: 1.05,
    duration: 0.7,
    blur: 12,
    swipe: 1,
    spring: 0.38,
    stagger: 0.12,
    focus: 1.025,
    opacity: 0.76,
  },
  motion: {
    speed: 1,
    background: true,
    fade: 1,
    reduced: false,
    responsiveness: 1,
  },
};
export type Effects = typeof defaults;
export type Group = keyof Effects;
export type Field = {
  key: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  type?: "color" | "toggle" | "select";
  options?: string[];
};
const range = (
  key: string,
  label: string,
  min: number,
  max: number,
  step = 0.01,
  unit = "",
): Field => ({ key, label, min, max, step, unit });
const toggle = (key: string, label: string): Field => ({
  key,
  label,
  type: "toggle",
});
export const fields: Record<Group, Field[]> = {
  welcome: [
    range("size", "Button size", 180, 360, 1, "px"),
    range("radius", "Corner radius", 16, 180, 1, "px"),
    range("opacity", "Glass opacity", 0.05, 1),
    range("blur", "Backdrop blur", 0, 48, 1, "px"),
    range("border", "Reflection opacity", 0, 1),
    range("glow", "Glow intensity", 0, 1),
    range("shadow", "Shadow intensity", 0, 1),
    range("hover", "Hover response", 1, 1.15),
    range("press", "Press scale", 0.75, 1),
    toggle("idle", "Idle breathing"),
  ],
  transition: [
    range("duration", "Transition duration", 0.3, 3, 0.05, "s"),
    range("initialScale", "Initial scale", 0.6, 1.2),
    range("finalScale", "Final scale", 7, 22, 0.5),
    range("stiffness", "Spring stiffness", 30, 250, 1),
    range("damping", "Spring damping", 8, 45, 1),
    range("fade", "Fade timing", 0, 0.9),
    range("blur", "Blur timing", 0, 1),
    toggle("background", "Background transition"),
    {
      key: "easing",
      label: "Easing curve",
      type: "select",
      options: ["fluid", "spring", "ease-in-out"],
    },
  ],
  orb: [
    range("size", "Orb size", 160, 460, 1, "px"),
    range("position", "Vertical position", -100, 100, 1, "px"),
    { key: "primary", label: "Primary color", type: "color" },
    { key: "secondary", label: "Secondary color", type: "color" },
    range("glow", "Glow intensity", 0, 1),
    range("distortion", "Surface distortion", 0, 1),
    range("noise", "Internal noise", 0, 1),
    range("speed", "Motion speed", 0.05, 2),
    range("pulse", "Pulse intensity", 0, 1),
    range("sensitivity", "Voice sensitivity", 0, 2),
    range("rotation", "Rotation speed", 0, 2),
    range("blur", "Blur", 0, 12, 0.5, "px"),
    range("opacity", "Transparency", 0.2, 1),
    toggle("listening", "Listening effect"),
    toggle("thinking", "Thinking effect"),
    toggle("speaking", "Speaking effect"),
  ],
  cards: [
    range("width", "Card width", 230, 380, 1, "px"),
    range("height", "Card height", 330, 480, 1, "px"),
    range("radius", "Corner radius", 8, 48, 1, "px"),
    range("gap", "Card spacing", 8, 36, 1, "px"),
    range("imageScale", "Image scale", 1, 1.35),
    range("duration", "Transition duration", 0.2, 1.5, 0.05, "s"),
    range("blur", "Entrance blur", 0, 24, 1, "px"),
    range("swipe", "Swipe sensitivity", 0.4, 2),
    range("spring", "Spring bounce", 0, 0.7),
    range("stagger", "Entrance stagger", 0, 0.4, 0.01, "s"),
    range("focus", "Focus scale", 1, 1.08),
    range("opacity", "Background opacity", 0.2, 1),
  ],
  motion: [
    range("speed", "Overall motion speed", 0.3, 2),
    toggle("background", "Ambient background motion"),
    range("fade", "Fade intensity", 0, 1),
    toggle("reduced", "Reduced motion"),
    range("responsiveness", "UI response speed", 0.5, 2),
  ],
};
export function validateEffects(input: unknown): Effects {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Configuration must be an object.");
  const result = structuredClone(defaults);
  for (const group of Object.keys(fields) as Group[]) {
    const obj = (input as Record<string, unknown>)[group];
    if (!obj || typeof obj !== "object" || Array.isArray(obj))
      throw new Error(`Missing ${group} settings.`);
    for (const field of fields[group]) {
      const value = (obj as Record<string, unknown>)[field.key];
      if (
        field.type === "toggle"
          ? typeof value !== "boolean"
          : field.type === "color"
            ? typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)
            : field.type === "select"
              ? !field.options?.includes(String(value))
              : typeof value !== "number" ||
                !Number.isFinite(value) ||
                value < field.min! ||
                value > field.max!
      )
        throw new Error(`Invalid ${group}.${field.key}`);
      (result[group] as Record<string, unknown>)[field.key] = value;
    }
  }
  return result;
}
export const builtins: {
  name: string;
  description: string;
  config: Effects;
}[] = [
  {
    name: "The Hub signature",
    description: "Balanced glass. Effortless motion.",
    config: defaults,
  },
  {
    name: "Quiet morning",
    description: "Softer light. A slower pace.",
    config: {
      ...defaults,
      orb: {
        ...defaults.orb,
        speed: 0.25,
        distortion: 0.2,
        secondary: "#b3e4ff",
      },
      motion: { ...defaults.motion, speed: 0.7 },
    },
  },
  {
    name: "Blue hour",
    description: "Deeper color. A little more energy.",
    config: {
      ...defaults,
      orb: {
        ...defaults.orb,
        primary: "#063285",
        secondary: "#57b7ff",
        distortion: 0.6,
        glow: 0.8,
      },
      welcome: { ...defaults.welcome, glow: 0.7 },
    },
  },
];
export type Preset = { id: string; name: string; config: Effects };
export type AdminDocument = {
  draft: Effects;
  presets: Preset[];
  updatedAt?: string;
  publishedAt?: string;
};
