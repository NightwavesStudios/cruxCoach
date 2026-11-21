import { describe, expect, it } from "vitest";
import { levelFor } from "./levels";
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
    expect(levelFor("bouldering", sessions, ascents).grade).toBe("—");
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
