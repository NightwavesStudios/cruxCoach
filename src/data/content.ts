export type CollectionId = "holds" | "angles" | "style" | "training";
export type ContentType = "Article" | "Workout" | "Practice";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  length: string;
  difficulty: Difficulty[];
  tags: string[];
  collection: CollectionId;
  summary: string;
}

export const COLLECTIONS: {
  id: CollectionId;
  title: string;
  description: string;
}[] = [
  {
    id: "holds",
    title: "Holds",
    description: "Crimps, slopers, pockets, sidepulls, underclings and pinches.",
  },
  {
    id: "angles",
    title: "Wall angles",
    description: "Slabs, slight overhangs, steep walls and roofs.",
  },
  {
    id: "style",
    title: "Climbing style",
    description: "Big moves, precision, power, route reading and endurance.",
  },
  {
    id: "training",
    title: "Training sessions",
    description: "Workouts and practices you can take straight to the wall.",
  },
];

export const CONTENT: ContentItem[] = [
  {
    id: "intro-crimps",
    title: "Intro to Crimps",
    type: "Article",
    length: "8 min",
    difficulty: ["beginner"],
    tags: ["crimp"],
    collection: "holds",
    summary: "Open, half and closed crimps — when to use each and how to protect your fingers.",
  },
  {
    id: "intro-slopers",
    title: "Intro to Slopers",
    type: "Article",
    length: "7 min",
    difficulty: ["beginner"],
    tags: ["sloper"],
    collection: "holds",
    summary: "Use friction, body position and open hands to make rounded holds feel secure.",
  },
  {
    id: "intro-pockets",
    title: "Intro to Pockets",
    type: "Article",
    length: "7 min",
    difficulty: ["beginner"],
    tags: ["pocket"],
    collection: "holds",
    summary: "Two- and three-finger pockets, tendon load and the pacing that keeps them safe.",
  },
  {
    id: "intro-sidepulls",
    title: "Intro to Sidepulls",
    type: "Article",
    length: "6 min",
    difficulty: ["beginner"],
    tags: ["sidepull"],
    collection: "holds",
    summary: "Turn sidepulls into pushes with foot placement, hips and counter-pressure.",
  },
  {
    id: "intro-underclings",
    title: "Intro to Underclings",
    type: "Article",
    length: "6 min",
    difficulty: ["beginner"],
    tags: ["undercling"],
    collection: "holds",
    summary: "Biceps, tension and footwork for pulling upwards on downward-facing holds.",
  },
  {
    id: "intro-pinch",
    title: "Intro to Pinches",
    type: "Article",
    length: "6 min",
    difficulty: ["beginner"],
    tags: ["pinch"],
    collection: "holds",
    summary: "Thumb engagement, wrist position and the small adjustments that save energy.",
  },
  {
    id: "intro-slab",
    title: "Intro to Slabs",
    type: "Article",
    length: "7 min",
    difficulty: ["beginner"],
    tags: ["slab"],
    collection: "angles",
    summary: "Trust your feet, keep your weight over the wall and stay calm on friction.",
  },
  {
    id: "intro-slight-overhangs",
    title: "Intro to Slight Overhangs",
    type: "Article",
    length: "7 min",
    difficulty: ["beginner"],
    tags: ["slight-overhang"],
    collection: "angles",
    summary: "The bridge between vertical and steep: body tension without wasting power.",
  },
  {
    id: "intro-overhangs",
    title: "Intro to Overhangs",
    type: "Article",
    length: "8 min",
    difficulty: ["beginner"],
    tags: ["overhang"],
    collection: "angles",
    summary: "Core tension, foot pressure and efficient rests on steep terrain.",
  },
  {
    id: "intro-roofs-caves",
    title: "Intro to Roofs and Caves",
    type: "Article",
    length: "8 min",
    difficulty: ["beginner"],
    tags: ["cave"],
    collection: "angles",
    summary: "Heel hooks, toe hooks and keeping tension when your feet leave the wall.",
  },
  {
    id: "intro-big-moves",
    title: "Intro to Big Moves",
    type: "Article",
    length: "8 min",
    difficulty: ["beginner"],
    tags: ["big-move"],
    collection: "style",
    summary: "Generate movement from your legs and arrive at the hold in control.",
  },
  {
    id: "intro-meticulous",
    title: "Intro to Meticulous Climbing",
    type: "Article",
    length: "7 min",
    difficulty: ["beginner"],
    tags: ["meticulous"],
    collection: "style",
    summary: "Precision, quiet feet and deliberate hand placement on technical climbs.",
  },
  {
    id: "intro-powerful",
    title: "Intro to Powerful Climbing",
    type: "Article",
    length: "7 min",
    difficulty: ["beginner"],
    tags: ["powerful"],
    collection: "style",
    summary: "Recruitment, body position and short, intense efforts without wasted tries.",
  },
  {
    id: "intro-route-reading",
    title: "Intro to Route Reading",
    type: "Article",
    length: "8 min",
    difficulty: ["beginner"],
    tags: ["route-reading"],
    collection: "style",
    summary: "Read sequences before you pull on and adjust your plan as you climb.",
  },
  {
    id: "intro-endurance",
    title: "Intro to Endurance",
    type: "Article",
    length: "8 min",
    difficulty: ["beginner"],
    tags: ["endurance"],
    collection: "style",
    summary: "Build a base, pace your efforts and recover on the wall instead of the ground.",
  },
  {
    id: "long-hang-crimp-workout",
    title: "Long Hang Crimp Workout",
    type: "Workout",
    length: "20–45 min",
    difficulty: ["intermediate", "advanced"],
    tags: ["crimp"],
    collection: "training",
    summary: "A progressive hangboard session for crimp strength and tendon resilience.",
  },
  {
    id: "sloper-sessions",
    title: "Sloper-Only Sessions",
    type: "Practice",
    length: "30 min",
    difficulty: ["beginner", "intermediate"],
    tags: ["sloper"],
    collection: "training",
    summary: "Spend a session on slopers only to build open-hand strength and body tension.",
  },
  {
    id: "silent-feet",
    title: "Silent Feet",
    type: "Practice",
    length: "20 min",
    difficulty: ["beginner"],
    tags: ["meticulous", "slab"],
    collection: "training",
    summary: "A precision drill: place every foot deliberately and land it without a sound.",
  },
  {
    id: "movement-learning",
    title: "Movement Learning",
    type: "Article",
    length: "10 min",
    difficulty: ["beginner"],
    tags: ["meticulous"],
    collection: "training",
    summary: "How to practise movement so new skills stick instead of disappearing.",
  },
];

export function contentById(id: string): ContentItem | undefined {
  return CONTENT.find((item) => item.id === id);
}

export function contentForCollection(collection: CollectionId): ContentItem[] {
  return CONTENT.filter((item) => item.collection === collection);
}
