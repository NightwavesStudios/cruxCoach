import { describe, expect, it } from "vitest";
import {
  generatePlanSessions,
  planDefaults,
  planEnvironment,
  planProgress,
  planWeek,
} from "./plans";
import type { Plan, PlanSession, Profile } from "./types";

const base = {
  discipline: "bouldering" as const,
  environment: "indoor" as const,
  targetGrade: "V6",
  weeks: 4,
  daysPerWeek: 3,
  focusTraits: ["Crimp", "Sloper"] as const,
};

describe("generatePlanSessions", () => {
  it("creates one session per available day", () => {
    const sessions = generatePlanSessions({ ...base, focusTraits: [...base.focusTraits] });
    expect(sessions).toHaveLength(12);
    expect(new Set(sessions.map((session) => session.week))).toEqual(new Set([1, 2, 3, 4]));
  });

  it("deloads every fourth week at 60% duration", () => {
    const sessions = generatePlanSessions({ ...base, focusTraits: [...base.focusTraits] });
    const deload = sessions.filter((session) => session.week === 4);
    expect(deload.every((session) => session.intensity === "deload")).toBe(true);
    expect(deload.every((session) => session.durationMin <= 60)).toBe(true);
  });

  it("names sessions after the focus traits", () => {
    const sessions = generatePlanSessions({ ...base, focusTraits: [...base.focusTraits] });
    expect(sessions[0].title).toContain("Crimp");
  });

  it("puts the target grade into project sessions", () => {
    const sessions = generatePlanSessions({ ...base, daysPerWeek: 4, focusTraits: [] });
    const projects = sessions.filter((session) => session.type === "project");
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((session) => session.title.includes("V6"))).toBe(true);
  });

  it("builds indoor and outdoor weeks around different work", () => {
    const indoor = generatePlanSessions({ ...base, environment: "indoor", focusTraits: [] });
    const outdoor = generatePlanSessions({ ...base, environment: "outdoor", focusTraits: [] });

    expect(indoor.some((session) => session.title.includes("Board power"))).toBe(true);
    expect(indoor.some((session) => session.title.includes("crag"))).toBe(false);
    expect(outdoor.some((session) => session.title.includes("Mileage at the crag"))).toBe(true);
    expect(outdoor.some((session) => session.title.includes("Board power"))).toBe(false);
    expect(outdoor.every((session) => session.durationMin >= 30)).toBe(true);
  });

  it("clamps weeks and days to supported ranges", () => {
    const sessions = generatePlanSessions({
      ...base,
      weeks: 20,
      daysPerWeek: 9,
      focusTraits: [],
    });
    expect(new Set(sessions.map((session) => session.week)).size).toBe(8);
    expect(sessions.filter((session) => session.week === 1)).toHaveLength(6);
  });
});

const plan: Plan = {
  id: "plan-a",
  name: "Spring block",
  discipline: "bouldering",
  targetGrade: "V6",
  weeks: 4,
  daysPerWeek: 2,
  startDate: "2026-01-05",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function plannedSession(
  id: string,
  planId: string,
  status: PlanSession["status"],
): PlanSession {
  return {
    id,
    planId,
    week: 1,
    day: 1,
    title: "Technique",
    type: "technique",
    durationMin: 60,
    intensity: "easy",
    status,
  };
}

const profile: Profile = {
  id: "me",
  name: "",
  email: "",
  disciplines: ["toprope"],
  goal: "",
  gradeSystem: "yds",
  units: "imperial",
  weeklyGoal: 5,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("planDefaults", () => {
  it("takes the discipline, weekly goal and grade system from the profile", () => {
    expect(planDefaults(profile)).toEqual({
      discipline: "toprope",
      daysPerWeek: 5,
      targetGrade: 13,
    });
  });

  it("clamps the weekly goal and falls back when no discipline is chosen", () => {
    expect(planDefaults({ ...profile, weeklyGoal: 9, disciplines: [] })).toEqual({
      discipline: "bouldering",
      daysPerWeek: 6,
      targetGrade: 13,
    });
    expect(planDefaults({ ...profile, gradeSystem: "v" }).targetGrade).toBe(5);
  });
});

describe("planWeek", () => {
  it("counts weeks from the start date and caps at the final week", () => {
    expect(planWeek(plan, "2026-01-01")).toBe(0);
    expect(planWeek(plan, "2026-01-05")).toBe(1);
    expect(planWeek(plan, "2026-01-11")).toBe(1);
    expect(planWeek(plan, "2026-01-12")).toBe(2);
    expect(planWeek(plan, "2026-03-01")).toBe(4);
  });
});

describe("planProgress", () => {
  it("counts only this plan's sessions", () => {
    const progress = planProgress(
      plan,
      [
        plannedSession("a", "plan-a", "done"),
        plannedSession("b", "plan-a", "done"),
        plannedSession("c", "plan-a", "skipped"),
        plannedSession("d", "plan-a", "planned"),
        plannedSession("e", "plan-b", "done"),
      ],
      "2026-01-12",
    );

    expect(progress).toMatchObject({
      week: 2,
      total: 4,
      done: 2,
      skipped: 1,
      remaining: 1,
      adherence: 50,
      ended: false,
    });
  });

  it("flags a block once its final week has passed", () => {
    const sessions = [plannedSession("a", "plan-a", "planned")];
    expect(planProgress(plan, sessions, "2026-02-01").ended).toBe(false);
    expect(planProgress(plan, sessions, "2026-02-02").ended).toBe(true);
  });

  it("counts a planned slot that was filled by a logged session", () => {
    const logged = { ...plannedSession("a", "plan-a", "planned"), sessionId: "session-1" };
    const progress = planProgress(plan, [logged], "2026-01-12");
    expect(progress.done).toBe(1);
    expect(progress.remaining).toBe(0);
    expect(progress.adherence).toBe(100);
  });
});

describe("planEnvironment", () => {
  it("falls back to indoor for plans made before venues existed", () => {
    expect(planEnvironment({})).toBe("indoor");
    expect(planEnvironment({ environment: "outdoor" })).toBe("outdoor");
  });
});
