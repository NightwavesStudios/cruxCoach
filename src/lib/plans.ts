import type { Discipline, Plan, PlanSession, TraitKey } from "./types";
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

export interface PlanProgress {
  week: number;
  total: number;
  done: number;
  skipped: number;
  remaining: number;
  adherence: number;
  ended: boolean;
}

const DAY_MS = 86_400_000;

function daysSince(startDate: string, today: string): number {
  return Math.floor(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS,
  );
}

/** Current week of the block, 0 before it starts and capped at its final week. */
export function planWeek(plan: Plan, today: string): number {
  const days = daysSince(plan.startDate, today);
  if (Number.isNaN(days) || days < 0) return 0;
  return Math.min(plan.weeks, Math.floor(days / 7) + 1);
}

export function planProgress(
  plan: Plan,
  planSessions: PlanSession[],
  today: string,
): PlanProgress {
  const sessions = planSessions.filter((session) => session.planId === plan.id);
  const done = sessions.filter((session) => session.status === "done").length;
  const skipped = sessions.filter((session) => session.status === "skipped").length;
  const days = daysSince(plan.startDate, today);

  return {
    week: planWeek(plan, today),
    total: sessions.length,
    done,
    skipped,
    remaining: sessions.length - done - skipped,
    adherence: sessions.length ? Math.round((done / sessions.length) * 100) : 0,
    ended: !Number.isNaN(days) && days >= plan.weeks * 7,
  };
}

export function planIntensityLabel(value: PlanSession["intensity"]): string {
  return {
    easy: "Easy",
    moderate: "Moderate",
    hard: "Hard",
    deload: "Deload",
  }[value];
}
