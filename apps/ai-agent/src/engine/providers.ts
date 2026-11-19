import type { State } from "./machine";
export type ScenarioId = "halong" | "hagiang" | "laundry" | "language";
export type Step = {
  state?: State;
  text?: string;
  customer?: string;
  delay: number;
  call?: "show_tours" | "create_inquiry" | "switch_language";
  destination?: string;
  language?: string;
};
export interface ConversationProvider {
  readonly mode: "simulation" | "realtime";
  scenario(id: ScenarioId): readonly Step[];
  dispose(): void;
}
export interface RealtimeProvider extends ConversationProvider {
  connect(signal: AbortSignal): Promise<void>;
  mute(muted: boolean): void;
  disconnect(): Promise<void>;
}
export const scenarios: Record<
  ScenarioId,
  { title: string; subtitle: string; prompt: string }
> = {
  halong: {
    title: "Ha Long Bay",
    subtitle: "A little wonder on the water",
    prompt: "Show me some Ha Long Bay cruises.",
  },
  hagiang: {
    title: "Ha Giang Loop",
    subtitle: "Take the scenic route",
    prompt: "I want a Ha Giang Loop tour for two people.",
  },
  laundry: {
    title: "Laundry help",
    subtitle: "Fresh clothes, easy travels",
    prompt: "How do I use the washing machine?",
  },
  language: {
    title: "Switch languages",
    subtitle: "English · Français · Tiếng Việt",
    prompt: "Can we speak in French, then Vietnamese?",
  },
};
export class MockProvider implements ConversationProvider {
  readonly mode = "simulation" as const;
  scenario(id: ScenarioId): readonly Step[] {
    const opening: Step[] = [
      { state: "SESSION_STARTING", delay: 650 },
      {
        state: "LISTENING",
        text: "I’m listening. Where shall we begin?",
        delay: 1300,
      },
      {
        state: "THINKING",
        customer: scenarios[id].prompt,
        text: "Let me find something for you.",
        delay: 1700,
      },
    ];
    const stories: Record<ScenarioId, Step[]> = {
      halong: [
        {
          state: "SPEAKING",
          text: "Limestone islands, quiet waters, and a change of pace. Here’s a little inspiration for Ha Long Bay and beyond.",
          delay: 3600,
        },
        {
          state: "SHOWING_CONTENT",
          call: "show_tours",
          destination: "all",
          text: "Find your next little adventure. Choose a card to take a closer look.",
          delay: 2500,
        },
      ],
      hagiang: [
        {
          state: "SPEAKING",
          text: "The mountain roads of Ha Giang are a beautiful adventure for two. What dates are you thinking of, and how many days would you like?",
          delay: 4300,
        },
        {
          state: "SHOWING_CONTENT",
          call: "show_tours",
          destination: "hagiang",
          text: "Here’s a sample itinerary to explore. A team member will confirm the details.",
          delay: 2300,
        },
        {
          call: "create_inquiry",
          text: "Demo inquiry prepared for two travelers. Nothing has been sent or booked.",
          delay: 1800,
        },
      ],
      laundry: [
        {
          state: "SPEAKING",
          text: "Let’s make laundry easy. First, separate your colors and check the care labels. Follow the instructions printed on your machine for detergent and loading.",
          delay: 5000,
        },
        {
          state: "SPEAKING",
          text: "Choose a cycle that suits your clothes. For payment, machine settings, or drying advice, our team at the counter can help. This is a sample guidance conversation.",
          delay: 5000,
        },
        {
          state: "LISTENING",
          text: "Anything else I can help with?",
          delay: 2000,
        },
      ],
      language: [
        {
          state: "SPEAKING",
          language: "fr",
          call: "switch_language",
          text: "Bien sûr ! Je peux vous aider à découvrir le Vietnam ou à utiliser la laverie. Que souhaitez-vous savoir ?",
          delay: 4200,
        },
        {
          state: "LISTENING",
          customer: "Bây giờ nói tiếng Việt nhé.",
          delay: 1500,
        },
        { state: "THINKING", delay: 1300 },
        {
          state: "SPEAKING",
          language: "vi",
          call: "switch_language",
          text: "Chào bạn! Mình có thể giúp bạn tìm hiểu tour du lịch hoặc hướng dẫn sử dụng dịch vụ giặt sấy tại The Hub.",
          delay: 4200,
        },
        { state: "LISTENING", text: "Bạn muốn khám phá điều gì?", delay: 1800 },
      ],
    };
    return [...opening, ...stories[id]];
  }
  dispose() {
    /* Phase A allocates no microphone, sockets, or paid services. */
  }
}
export type Tour = {
  id: string;
  title: string;
  destination: string;
  duration: string;
  description: string;
  image: string;
  highlights: string[];
  itinerary: string[];
  tag: string;
};
export interface TourProvider {
  list(destination?: string): Promise<Tour[]>;
}
export const tours: Tour[] = [
  {
    id: "halong",
    title: "Ha Long Bay Cruise",
    destination: "Ha Long Bay",
    duration: "Sample · 2 days, 1 night",
    description: "Slow down among limestone islands and emerald water.",
    image: "/images/halong.jpg",
    highlights: ["Limestone islands", "On the water", "Scenic cruising"],
    itinerary: [
      "A scenic journey from Hanoi to the bay.",
      "Time on the water to enjoy the limestone landscape.",
      "A relaxed return to Hanoi.",
    ],
    tag: "A different perspective",
  },
  {
    id: "ninhbinh",
    title: "A day in Ninh Binh",
    destination: "Ninh Binh",
    duration: "Sample · Full day",
    description: "Follow winding waterways into Vietnam’s quieter side.",
    image: "/images/ninhbinh.jpg",
    highlights: ["River landscapes", "Limestone peaks", "Countryside"],
    itinerary: [
      "Leave the city behind for the countryside.",
      "Explore the river and limestone scenery.",
      "Return to Hanoi after a day outdoors.",
    ],
    tag: "A breath of fresh air",
  },
  {
    id: "hagiang",
    title: "The Ha Giang Loop",
    destination: "Ha Giang",
    duration: "Sample · 4 days, 3 nights",
    description:
      "Mountain passes, open skies, and stories worth bringing home.",
    image: "/images/hagiang.jpg",
    highlights: ["Mountain passes", "Valley views", "Local culture"],
    itinerary: [
      "Travel to Ha Giang and meet your local team.",
      "Discover mountain scenery at a comfortable pace.",
      "Explore the valleys before the return journey.",
    ],
    tag: "For the adventurous",
  },
  {
    id: "sapa",
    title: "Sapa, one step at a time",
    destination: "Sapa",
    duration: "Sample · 2 days, 1 night",
    description: "Take the long way through misty hills and green terraces.",
    image: "/images/sapa.jpg",
    highlights: ["Rice terraces", "Walking trails", "Mountain air"],
    itinerary: [
      "Journey to the northern highlands.",
      "Walk through terrace landscapes with a local guide.",
      "Enjoy the mountain air before heading back.",
    ],
    tag: "Find your own pace",
  },
];
export class MockTourProvider implements TourProvider {
  async list(destination = "all") {
    return destination === "all"
      ? tours
      : tours.filter((t) => t.id === destination);
  }
}
