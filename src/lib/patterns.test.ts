import { describe, expect, it } from "vitest";
import {
  durationBreakdown,
  environmentComparison,
  environmentOf,
  environmentStats,
  gradeBreakdown,
  patternHighlights,
  styleBreakdown,
  weekdayBreakdown,
} from "./patterns";
import type { Ascent, Session } from "./types";

function session(
  id: string,
  date: string,
  overrides: Partial<Session> = {},
): Session {
  return {
    id,
    date,
    discipline: "bouldering",
    durationMin: 75,
    rpe: 6,
    location: "",
    notes: "",
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
    ...overrides,
  };
}

function ascent(
  sessionId: string,
  id: string,
  grade: number,
  sent = true,
  overrides: Partial<Ascent> = {},
): Ascent {
  return {
    id,
    sessionId,
    grade,
    system: "v",
    style: "flash",
    attempts: 1,
    sent,
    ...overrides,
  };
}

describe("environmentOf", () => {
  it("keeps a stored environment", () => {
    expect(environmentOf({ environment: "outdoor", location: "The Depot" })).toBe("outdoor");
    expect(environmentOf({ environment: "indoor", location: "Stanage Edge" })).toBe("indoor");
  });

  it("infers outdoor crag names and leaves gyms indoor", () => {
    expect(environmentOf({ location: "Horseshoe Quarry" })).toBe("outdoor");
    expect(environmentOf({ location: "Boulder field at Stanage" })).toBe("outdoor");
    expect(environmentOf({ location: "The Depot Manchester" })).toBe("indoor");
    expect(environmentOf({ location: "" })).toBe("indoor");
  });
});

describe("environmentStats", () => {
  const sessions = [
    session("i1", "2026-01-05", { environment: "indoor", durationMin: 60 }),
    session("i2", "2026-01-06", { environment: "indoor", durationMin: 90 }),
    session("o1", "2026-01-10", { environment: "outdoor", durationMin: 240, rpe: 8 }),
    session("t1", "2026-01-11", { environment: "indoor", discipline: "training" }),
  ];
  const ascents = [
    ascent("i1", "a1", 5, true),
    ascent("i1", "a2", 6, false, { style: "project", attempts: 4 }),
    ascent("i2", "a3", 7, true),
    ascent("o1", "a4", 4, true),
    ascent("o1", "a5", 8, false, { style: "project", attempts: 5 }),
  ];

  it("counts sessions, climbs and sends per environment", () => {
    const indoor = environmentStats(sessions, ascents, "indoor");
    expect(indoor.sessions).toBe(3);
    expect(indoor.climbingSessions).toBe(2);
    expect(indoor.climbs).toBe(3);
    expect(indoor.sends).toBe(2);
    expect(indoor.sendRate).toBe(67);
    expect(indoor.avgDuration).toBe(75);
  });

  it("finds the hardest send in that environment only", () => {
    const outdoor = environmentStats(sessions, ascents, "outdoor");
    expect(outdoor.hardest).toEqual({ grade: 4, system: "v" });
    expect(outdoor.attempts).toBe(6);
  });

  it("reports the indoor and outdoor gap", () => {
    const comparison = environmentComparison(sessions, ascents);
    expect(comparison.sendRateGap).toBe(17);
    expect(comparison.hardestGap).toBe(-3);
  });
});

describe("gradeBreakdown", () => {
  it("groups climbs by grade and keeps systems apart", () => {
    const sessions = [
      session("a", "2026-01-05"),
      session("b", "2026-01-06", { discipline: "lead" }),
    ];
    const ascents = [
      ascent("a", "a1", 5, true),
      ascent("a", "a2", 5, false),
      ascent("a", "a3", 6, true),
      ascent("b", "b1", 13, true, { system: "yds" }),
    ];

    const boulder = gradeBreakdown(sessions, ascents, ["bouldering"]);
    expect(boulder).toEqual([
      { grade: 5, system: "v", climbs: 2, sends: 1, attempts: 2, rate: 50 },
      { grade: 6, system: "v", climbs: 1, sends: 1, attempts: 1, rate: 100 },
    ]);

    const rope = gradeBreakdown(sessions, ascents, ["toprope", "lead"]);
    expect(rope).toHaveLength(1);
    expect(rope[0].system).toBe("yds");
  });
});

describe("weekdayBreakdown", () => {
  it("puts sessions on the right weekday and rates the climbs", () => {
    const sessions = [
      session("mon", "2026-01-05"),
      session("tue", "2026-01-06"),
      session("tue2", "2026-01-13"),
    ];
    const ascents = [
      ascent("mon", "a", 5, true),
      ascent("tue", "b", 5, false),
      ascent("tue2", "c", 5, true),
    ];

    const days = weekdayBreakdown(sessions, ascents);
    expect(days[0]).toMatchObject({ day: "Mon", sessions: 1, climbs: 1, sendRate: 100 });
    expect(days[0].sendRate).toBe(100);
    expect(days[1]).toMatchObject({ day: "Tue", sessions: 2, climbs: 2, sends: 1 });
    expect(days[1].sendRate).toBe(50);
  });
});

describe("durationBreakdown", () => {
  it("shows which session length converts best", () => {
    const sessions = [
      session("short", "2026-01-05", { durationMin: 45 }),
      session("long", "2026-01-06", { durationMin: 180 }),
    ];
    const ascents = [
      ascent("short", "a", 5, true),
      ascent("short", "b", 5, true),
      ascent("long", "c", 5, false),
      ascent("long", "d", 5, false),
    ];

    const buckets = durationBreakdown(sessions, ascents);
    expect(buckets[0]).toMatchObject({ label: "Under 60 min", sendRate: 100 });
    expect(buckets[3]).toMatchObject({ label: "120 min and over", sendRate: 0 });
  });
});

describe("styleBreakdown", () => {
  it("shares each send style across all climbs", () => {
    const ascents = [
      ascent("s", "a", 5, true, { style: "onsight" }),
      ascent("s", "b", 5, true, { style: "flash" }),
      ascent("s", "c", 5, true, { style: "repeat" }),
      ascent("s", "d", 5, false, { style: "project" }),
    ];
    expect(styleBreakdown(ascents)).toEqual([
      { style: "onsight", count: 1, share: 25 },
      { style: "flash", count: 1, share: 25 },
      { style: "repeat", count: 1, share: 25 },
      { style: "project", count: 1, share: 25 },
    ]);
  });
});

describe("patternHighlights", () => {
  it("calls out a real indoor and outdoor send-rate gap", () => {
    const sessions = [
      session("i", "2026-01-05", { environment: "indoor" }),
      session("o", "2026-01-06", { environment: "outdoor" }),
    ];
    const ascents = [
      ascent("i", "i1", 5, true),
      ascent("i", "i2", 5, true),
      ascent("i", "i3", 5, true),
      ascent("i", "i4", 5, true),
      ascent("o", "o1", 5, false),
      ascent("o", "o2", 5, false),
      ascent("o", "o3", 5, false),
      ascent("o", "o4", 5, true),
    ];

    const insights = patternHighlights(sessions, ascents);
    expect(insights[0]).toMatchObject({ key: "send-rate", title: "Indoors converts better" });
    expect(insights[0].detail).toContain("100% of 4 indoor climbs");
    expect(insights[0].detail).toContain("25% of 4 outdoor");
  });

  it("does not draw a split from a handful of climbs", () => {
    const sessions = [session("i", "2026-01-05", { environment: "indoor" })];
    const ascents = [ascent("i", "a", 5, true)];

    expect(patternHighlights(sessions, ascents)).toEqual([]);
  });
});
