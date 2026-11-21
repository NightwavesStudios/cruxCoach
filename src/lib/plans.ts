import type { Discipline, Environment, Plan, PlanSession, Profile, TraitKey } from "./types";
import { DISCIPLINES, TRAITS } from "./types";

export interface PlanInput {
  discipline: Discipline;
  environment: Environment;
  targetGrade: string;
  weeks: number;
  daysPerWeek: number;
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

interface TemplateSlot {
  title: (focus: string, target: string) => string;
  type: PlanSession["type"];
  duration: number;
}

/**
 * Indoor and outdoor blocks are different weeks. A gym block can load the board
 * and repeat attempts; an outdoor block has to fit travel, conditions and skin.
 */
const TEMPLATES: Record<Environment, TemplateSlot[]> = {
  indoor: [
    { title: (focus) => `Technique: ${focus}`, type: "technique", duration: 60 },
    { title: () => "Board power", type: "strength", duration: 75 },
    { title: () => "Endurance laps", type: "endurance", duration: 60 },
    { title: (_focus, target) => `Project session: ${target}`, type: "project", duration: 90 },
    { title: () => "Mobility and recovery", type: "technique", duration: 30 },
    { title: () => "Technique volume", type: "technique", duration: 60 },
  ],
  outdoor: [
    { title: (focus) => `Crag movement: ${focus}`, type: "technique", duration: 90 },
    { title: () => "Mileage at the crag", type: "endurance", duration: 120 },
    { title: (_focus, target) => `Project: ${target}`, type: "project", duration: 120 },
    { title: () => "Strength maintenance", type: "strength", duration: 60 },
    { title: () => "Skin and recovery", type: "technique", duration: 30 },
    { title: () => "Volume at the crag", type: "endurance", duration: 120 },
  ],
};

export function planEnvironment(plan: Pick<Plan, "environment">): Environment {
  return plan.environment ?? "indoor";
}

export function generatePlanSessions(input: PlanInput): GeneratedPlanSession[] {
  const weeks = Math.max(2, Math.min(8, Math.round(input.weeks)));
  const days = Math.max(2, Math.min(6, Math.round(input.daysPerWeek)));
  const focus = input.focusTraits
    .map((key) => TRAITS.find((trait) => trait.key === key)?.label)
    .filter(Boolean);
  const focusLabel = focus.length ? focus.join(", ") : "movement quality";
  const template = TEMPLATES[input.environment];

  const sessions: GeneratedPlanSession[] = [];

  for (let week = 1; week <= weeks; week += 1) {
    const deload = week % 4 === 0;
    for (let day = 1; day <= days; day += 1) {
      const slot = template[(day - 1) % template.length];
      const title = slot.title(focusLabel, input.targetGrade);
      sessions.push({
        week,
        day,
        title: deload ? `Deload: ${title}` : title,
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
  const done = sessions.filter(
    (session) => session.status === "done" || Boolean(session.sessionId),
  ).length;
  const skipped = sessions.filter(
    (session) => session.status === "skipped" && !session.sessionId,
  ).length;
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

export interface PlanDefaults {
  discipline: Discipline;
  daysPerWeek: number;
  targetGrade: number;
}

/** Wizard defaults taken from the profile: chosen discipline, weekly goal and grade system. */
export function planDefaults(profile: Profile): PlanDefaults {
  const chosen = DISCIPLINES.map((item) => item.id).filter(
    (id) => id !== "training" && profile.disciplines.includes(id),
  );

  return {
    discipline: chosen[0] ?? "bouldering",
    daysPerWeek: Math.max(2, Math.min(6, Math.round(profile.weeklyGoal))),
    targetGrade: profile.gradeSystem === "v" ? 5 : 13,
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
