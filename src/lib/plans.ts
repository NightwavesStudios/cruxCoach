import type { Discipline, PlanSession, TraitKey } from "./types";
import { TRAITS } from "./types";

export interface PlanInput {
  discipline: Discipline;
  targetGrade: string;
  weeks: number;
  daysPerWeek: number;
  startDate: string;
  focusTraits: TraitKey[];
}

export interface GeneratedPlanSession {
  week: number;
  day: number;
  title: string;
  type: PlanSession["type"];
  durationMin: number;
  intensity: PlanSession["intensity"];
}

const TEMPLATE: {
  title: (focus: string) => string;
  type: PlanSession["type"];
  duration: number;
}[] = [
  { title: (focus) => `Technique: ${focus}`, type: "technique", duration: 60 },
  { title: () => "Strength & power", type: "strength", duration: 75 },
  { title: () => "Endurance session", type: "endurance", duration: 60 },
  { title: () => "Project session", type: "project", duration: 90 },
  { title: () => "Mobility & recovery", type: "technique", duration: 30 },
  { title: () => "Technique volume", type: "technique", duration: 60 },
];

export function generatePlanSessions(input: PlanInput): GeneratedPlanSession[] {
  const weeks = Math.max(2, Math.min(8, Math.round(input.weeks)));
  const days = Math.max(2, Math.min(6, Math.round(input.daysPerWeek)));
  const focus = input.focusTraits
    .map((key) => TRAITS.find((trait) => trait.key === key)?.label)
    .filter(Boolean);
  const focusLabel = focus.length ? focus.join(", ") : "movement quality";

  const sessions: GeneratedPlanSession[] = [];

  for (let week = 1; week <= weeks; week += 1) {
    const deload = week % 4 === 0;
    for (let day = 1; day <= days; day += 1) {
      const slot = TEMPLATE[(day - 1) % TEMPLATE.length];
      sessions.push({
        week,
        day,
        title: deload ? `Deload · ${slot.title(focusLabel)}` : slot.title(focusLabel),
        type: slot.type,
        durationMin: deload ? Math.round(slot.duration * 0.6) : slot.duration,
        intensity: deload
          ? "deload"
          : week === weeks
            ? "moderate"
            : day === 1
              ? "easy"
              : "hard",
      });
    }
  }

  return sessions;
}

export function planIntensityLabel(value: PlanSession["intensity"]): string {
  return {
    easy: "Easy",
    moderate: "Moderate",
    hard: "Hard",
    deload: "Deload",
  }[value];
}
