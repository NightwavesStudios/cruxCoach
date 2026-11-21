export type Discipline = "bouldering" | "toprope" | "lead" | "training";
export type GradeSystem = "v" | "yds";
export type AscentStyle = "onsight" | "flash" | "repeat" | "project";
export type Confidence = "learning" | "developing" | "established";

export const DISCIPLINES: { id: Discipline; label: string }[] = [
  { id: "bouldering", label: "Bouldering" },
  { id: "toprope", label: "Top rope" },
  { id: "lead", label: "Lead" },
  { id: "training", label: "Training" },
];

export const ASCENT_STYLES: { id: AscentStyle; label: string }[] = [
  { id: "onsight", label: "Onsight" },
  { id: "flash", label: "Flash" },
  { id: "repeat", label: "Repeat" },
  { id: "project", label: "Project" },
];

export const TRAITS = [
  { key: "Crimp", label: "Crimp", group: "Holds" },
  { key: "Sloper", label: "Sloper", group: "Holds" },
  { key: "Pocket", label: "Pocket", group: "Holds" },
  { key: "Sidepull", label: "Sidepull", group: "Holds" },
  { key: "Undercling", label: "Undercling", group: "Holds" },
  { key: "Pinch", label: "Pinch", group: "Holds" },
  { key: "Slab", label: "Slab", group: "Angles" },
  { key: "Slightoverhang", label: "Slight overhang", group: "Angles" },
  { key: "Overhang", label: "Overhang", group: "Angles" },
  { key: "Cave", label: "Roof / cave", group: "Angles" },
  { key: "Bigmove", label: "Big moves", group: "Style" },
  { key: "Meticulous", label: "Meticulous", group: "Style" },
  { key: "Powerful", label: "Powerful", group: "Style" },
  { key: "Routereading", label: "Route reading", group: "Style" },
  { key: "Endurance", label: "Endurance", group: "Style" },
] as const;

export type TraitKey = (typeof TRAITS)[number]["key"];
export type TraitGroup = (typeof TRAITS)[number]["group"];

export interface Session {
  id: string;
  date: string;
  discipline: Discipline;
  durationMin: number;
  rpe: number;
  location: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ascent {
  id: string;
  sessionId: string;
  grade: number;
  system: GradeSystem;
  style: AscentStyle;
  attempts: number;
  sent: boolean;
}

export interface Reflection {
  id: string;
  sessionId: string | null;
  date: string;
  scores: Partial<Record<TraitKey, number>>;
  confidence: number;
  notes: string;
  createdAt: string;
}

export interface Profile {
  id: "me";
  name: string;
  email: string;
  disciplines: Discipline[];
  goal: string;
  gradeSystem: GradeSystem;
  units: "metric" | "imperial";
  createdAt: string;
  legacyImportedAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  discipline: Discipline;
  targetGrade: string;
  weeks: number;
  daysPerWeek: number;
  startDate: string;
  status: "active" | "completed";
  createdAt: string;
}

export interface PlanSession {
  id: string;
  planId: string;
  week: number;
  day: number;
  title: string;
  type: "technique" | "strength" | "endurance" | "project";
  durationMin: number;
  intensity: "easy" | "moderate" | "hard" | "deload";
  status: "planned" | "done" | "skipped";
}

export interface ContentProgress {
  contentId: string;
  status: "saved" | "done";
  updatedAt: string;
}

export const DISCIPLINE_SYSTEM: Record<Discipline, GradeSystem> = {
  bouldering: "v",
  toprope: "yds",
  lead: "yds",
  training: "v",
};
