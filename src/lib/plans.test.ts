import { describe, expect, it } from "vitest";
import { generatePlanSessions } from "./plans";

const base = {
  discipline: "bouldering" as const,
  targetGrade: "V6",
  weeks: 4,
  daysPerWeek: 3,
  startDate: "2026-01-05",
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
