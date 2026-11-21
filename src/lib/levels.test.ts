import { describe, expect, it } from "vitest";
import { levelFor, weekProgress } from "./levels";
import type { Ascent, Session } from "./types";

function session(id: string, date: string, discipline: Session["discipline"]): Session {
  return {
    id,
    date,
    discipline,
    durationMin: 60,
    rpe: 5,
    location: "",
    notes: "",
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

function ascent(sessionId: string, grade: number, system: Ascent["system"], sent = true): Ascent {
  return { id: `${sessionId}-${grade}`, sessionId, grade, system, style: "flash", attempts: 1, sent };
}

describe("levelFor", () => {
  it("uses the rolling median of sent grades", () => {
    const sessions = [
      session("a", "2026-01-01", "bouldering"),
      session("b", "2026-01-03", "bouldering"),
      session("c", "2026-01-05", "bouldering"),
    ];
    const ascents = [ascent("a", 5, "v"), ascent("b", 7, "v"), ascent("c", 6, "v")];
    const level = levelFor("bouldering", sessions, ascents);
    expect(level.grade).toBe("V5");
    expect(level.samples).toBe(3);
  });

  it("ignores projects and training sessions", () => {
    const sessions = [
      session("a", "2026-01-01", "bouldering"),
      session("b", "2026-01-02", "training"),
    ];
    const ascents = [ascent("a", 8, "v", false), ascent("b", 10, "v")];
    expect(levelFor("bouldering", sessions, ascents).grade).toBe("None");
  });

  it("compares sends across grade systems and shows the preferred one", () => {
    const sessions = [
      session("a", "2026-01-01", "bouldering"),
      session("b", "2026-01-02", "bouldering"),
    ];
    const ascents = [ascent("a", 5, "v"), ascent("b", 7, "yds")];
    expect(levelFor("bouldering", sessions, ascents, "v").grade).toBe("V4");
    expect(levelFor("bouldering", sessions, ascents, "yds").grade).toBe("5.10c");
  });

  it("combines top rope and lead sends into the rope level", () => {
    const sessions = [
      session("a", "2026-01-01", "toprope"),
      session("b", "2026-01-02", "lead"),
    ];
    const ascents = [ascent("a", 12, "yds"), ascent("b", 14, "yds")];
    const level = levelFor("lead", sessions, ascents);
    expect(level.samples).toBe(2);
    expect(level.grade).toBe("5.12a");
  });
});

describe("weekProgress", () => {
  const sessions = [
    session("a", "2026-01-05", "bouldering"),
    session("b", "2026-01-06", "training"),
    session("c", "2026-01-04", "bouldering"),
    session("d", "2026-01-11", "toprope"),
  ];

  it("counts this week's sessions in the chosen disciplines", () => {
    expect(weekProgress(sessions, 3, ["bouldering", "toprope"], "2026-01-07")).toMatchObject({
      count: 2,
      goal: 3,
      remaining: 1,
      percent: 67,
      met: false,
    });
  });

  it("marks the goal met from the chosen disciplines only", () => {
    expect(weekProgress(sessions, 1, ["bouldering"], "2026-01-07")).toMatchObject({
      count: 1,
      remaining: 0,
      percent: 100,
      met: true,
    });
  });
});
