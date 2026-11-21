import { describe, expect, it } from "vitest";
import {
  createProject,
  projectStats,
  projectSummary,
  projectTotalsForSession,
  resolveProjectForPlan,
  setProjectStatus,
  updateProject,
} from "./projects";
import type {
  Ascent,
  Plan,
  PlanSession,
  Project,
  Session,
} from "./types";

function session(
  id: string,
  date: string,
  overrides: Partial<Session> = {},
): Session {
  return {
    id,
    date,
    discipline: "bouldering",
    durationMin: 90,
    rpe: 7,
    location: "",
    notes: "",
    environment: "indoor",
    createdAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
    ...overrides,
  };
}

function ascent(
  id: string,
  sessionId: string,
  grade: number,
  overrides: Partial<Ascent> = {},
): Ascent {
  return {
    id,
    sessionId,
    grade,
    system: "v",
    style: "project",
    attempts: 1,
    sent: false,
    ...overrides,
  };
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-a",
    name: "Cave line",
    discipline: "bouldering",
    environment: "indoor",
    grade: 6,
    system: "v",
    status: "trying",
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("createProject", () => {
  it("starts a project as trying and stamps both dates", () => {
    const created = createProject(
      {
        name: "  Cave line  ",
        discipline: "bouldering",
        environment: "indoor",
        grade: 6,
        system: "v",
        notes: " Start on the left rail. ",
      },
      "2026-01-02T10:00:00.000Z",
      "project-1",
    );

    expect(created).toMatchObject({
      id: "project-1",
      name: "Cave line",
      status: "trying",
      notes: "Start on the left rail.",
      createdAt: "2026-01-02T10:00:00.000Z",
      updatedAt: "2026-01-02T10:00:00.000Z",
    });
  });

  it("falls back to the grade when no name is given", () => {
    const created = createProject({
      name: "   ",
      discipline: "bouldering",
      environment: "outdoor",
      grade: 6,
      system: "v",
    });
    expect(created.name).toBe("V5 project");
  });
});

describe("updateProject", () => {
  it("edits details and moves updatedAt without touching createdAt", () => {
    const updated = updateProject(
      project(),
      { name: " Cave link ", notes: " New beta. " },
      "2026-02-01T00:00:00.000Z",
    );

    expect(updated.name).toBe("Cave link");
    expect(updated.notes).toBe("New beta.");
    expect(updated.updatedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(updated.createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("changes status without losing the rest of the record", () => {
    const sent = setProjectStatus(project(), "sent", "2026-02-02T00:00:00.000Z");
    expect(sent.status).toBe("sent");
    expect(sent.grade).toBe(6);
    expect(sent.updatedAt).toBe("2026-02-02T00:00:00.000Z");
  });
});

describe("projectStats", () => {
  const linkedIndoor = [
    session("s1", "2026-01-05", { projectId: "project-a" }),
    session("s2", "2026-01-12", { projectId: "project-a" }),
  ];
  const ascents = [
    ascent("a1", "s1", 6, { attempts: 3 }),
    ascent("a2", "s1", 5, { style: "flash", sent: true }),
    ascent("a3", "s2", 6, { style: "flash", attempts: 1, sent: true }),
    ascent("a4", "s2", 6, { style: "repeat", attempts: 2, sent: true }),
    ascent("warmup", "s2", 4, { style: "flash", sent: true }),
  ];

  it("derives attempts, sends, first tries and span from linked sessions", () => {
    const stats = projectStats(project(), linkedIndoor, ascents);

    expect(stats).toMatchObject({
      sessions: 2,
      attempts: 6,
      sends: 2,
      firstTrySends: 1,
      firstDate: "2026-01-05",
      lastDate: "2026-01-12",
      spanDays: 8,
      bestSend: { grade: 6, system: "v" },
    });
    expect(stats.timeline).toEqual([
      { date: "2026-01-05", attempts: 3, sends: 0 },
      { date: "2026-01-12", attempts: 3, sends: 2 },
    ]);
  });

  it("reads one attached session at a time for the detail list", () => {
    expect(projectTotalsForSession(project(), linkedIndoor[1], ascents)).toEqual({
      attempts: 3,
      sends: 2,
    });
  });

  it("drops back to zero when the project link is detached", () => {
    const detached = linkedIndoor.map((item) =>
      item.id === "s2" ? { ...item, projectId: undefined } : item,
    );
    const stats = projectStats(project(), detached, ascents);

    expect(stats.sessions).toBe(1);
    expect(stats.attempts).toBe(3);
    expect(stats.sends).toBe(0);
    expect(stats.bestSend).toEqual({ grade: 5, system: "v" });
  });

  it("never counts an outdoor session attached to an indoor project", () => {
    const withOutdoor = [
      ...linkedIndoor,
      session("out", "2026-01-20", {
        projectId: "project-a",
        environment: "outdoor",
      }),
    ];
    const outdoorAscent = ascent("out-a", "out", 6, { sent: true, attempts: 5 });
    const stats = projectStats(project(), withOutdoor, [...ascents, outdoorAscent]);

    expect(stats.sessions).toBe(2);
    expect(stats.attempts).toBe(6);
    expect(stats.sends).toBe(2);
    expect(projectTotalsForSession(project(), withOutdoor[2], [outdoorAscent])).toEqual({
      attempts: 0,
      sends: 0,
    });
  });
});

const plan: Plan = {
  id: "plan-a",
  name: "Crag block",
  discipline: "bouldering",
  environment: "outdoor",
  targetGrade: "V5",
  targetSystem: "v",
  weeks: 4,
  daysPerWeek: 3,
  startDate: "2026-01-05",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function projectSlot(overrides: Partial<PlanSession> = {}): PlanSession {
  return {
    id: "slot",
    planId: plan.id,
    week: 1,
    day: 3,
    title: "Project: V5",
    type: "project",
    durationMin: 120,
    intensity: "hard",
    status: "planned",
    ...overrides,
  };
}

describe("resolveProjectForPlan", () => {
  const indoorV5 = project({ id: "indoor", environment: "indoor", grade: 6, updatedAt: "2026-03-01T00:00:00.000Z" });
  const outdoorV6 = project({ id: "outdoor-v6", environment: "outdoor", grade: 7 });
  const olderOutdoorV5 = project({
    id: "outdoor-old",
    environment: "outdoor",
    grade: 6,
    updatedAt: "2026-02-01T00:00:00.000Z",
  });
  const newerOutdoorV5 = project({
    id: "outdoor-new",
    environment: "outdoor",
    grade: 6,
    updatedAt: "2026-02-10T00:00:00.000Z",
  });

  it("picks the latest live project at the plan venue and grade", () => {
    const resolved = resolveProjectForPlan(
      [indoorV5, outdoorV6, olderOutdoorV5, newerOutdoorV5],
      plan,
      projectSlot(),
    );
    expect(resolved?.id).toBe("outdoor-new");
  });

  it("does not cross venues and ignores abandoned projects", () => {
    expect(
      resolveProjectForPlan(
        [indoorV5, { ...olderOutdoorV5, status: "abandoned" }],
        plan,
        projectSlot(),
      ),
    ).toBeUndefined();
  });

  it("leaves non-project slots and missing projects unresolved", () => {
    expect(
      resolveProjectForPlan([newerOutdoorV5], plan, projectSlot({ type: "technique" })),
    ).toBeUndefined();
    expect(resolveProjectForPlan([indoorV5, outdoorV6], plan, projectSlot())).toBeUndefined();
  });
});

describe("projectSummary", () => {
  const projects = [
    project({ id: "i1", environment: "indoor", grade: 6 }),
    project({ id: "i2", environment: "indoor", grade: 5, status: "sent" }),
    project({ id: "o1", environment: "outdoor", grade: 7 }),
    project({ id: "o2", environment: "outdoor", grade: 5, status: "abandoned" }),
  ];
  const sessions = [
    session("i1-s", "2026-01-05", { projectId: "i1" }),
    session("o1-s", "2026-01-06", { projectId: "o1", environment: "outdoor" }),
  ];
  const ascents = [
    ascent("a1", "i1-s", 6, { attempts: 4 }),
    ascent("a2", "o1-s", 7, { attempts: 2 }),
  ];

  it("separates the venues and counts sends from real sessions", () => {
    const indoor = projectSummary(projects, sessions, ascents, "indoor");
    const outdoor = projectSummary(projects, sessions, ascents, "outdoor");

    expect(indoor).toEqual({ projects: 2, trying: 1, sent: 1, attempts: 4 });
    expect(outdoor).toEqual({ projects: 2, trying: 1, sent: 0, attempts: 2 });
  });
});
