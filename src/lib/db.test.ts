import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db, deleteSession, exportAll, importAll, saveReflection, saveSession } from "./db";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

const session = {
  date: "2026-01-05",
  discipline: "bouldering" as const,
  durationMin: 75,
  rpe: 7,
  location: "Local gym",
  notes: "Good session.",
};

const ascent = {
  grade: 5,
  system: "v" as const,
  style: "flash" as const,
  attempts: 1,
  sent: true,
};

async function readAllTables() {
  return {
    profile: await db.profile.toArray(),
    sessions: await db.sessions.toArray(),
    ascents: await db.ascents.toArray(),
    reflections: await db.reflections.toArray(),
    plans: await db.plans.toArray(),
    planSessions: await db.planSessions.toArray(),
    contentProgress: await db.contentProgress.toArray(),
  };
}

describe("saveSession", () => {
  it("stores a session and its ascents", async () => {
    const id = await saveSession(session, [ascent]);
    expect(await db.sessions.count()).toBe(1);
    expect(await db.ascents.where("sessionId").equals(id).count()).toBe(1);
    expect((await db.sessions.get(id))?.notes).toBe("Good session.");
  });

  it("replaces ascents when editing without duplicating the session", async () => {
    const id = await saveSession(session, [ascent]);
    await saveSession(session, [{ ...ascent, grade: 7 }], id);
    expect(await db.sessions.count()).toBe(1);
    const ascents = await db.ascents.where("sessionId").equals(id).toArray();
    expect(ascents).toHaveLength(1);
    expect(ascents[0].grade).toBe(7);
  });

  it("deletes linked ascents and reflections", async () => {
    const id = await saveSession(session, [ascent]);
    await db.reflections.put({
      id: "reflection",
      sessionId: id,
      date: session.date,
      scores: { Crimp: -1 },
      confidence: 3,
      notes: "",
      createdAt: new Date().toISOString(),
    });
    await deleteSession(id);
    expect(await db.sessions.count()).toBe(0);
    expect(await db.ascents.count()).toBe(0);
    expect(await db.reflections.count()).toBe(0);
  });

  it("reopens a planned slot when its logged session is deleted", async () => {
    const id = await saveSession(session, [ascent]);
    await db.planSessions.put({
      id: "slot",
      planId: "plan-a",
      week: 1,
      day: 1,
      title: "Project: V4",
      type: "project",
      durationMin: 90,
      intensity: "hard",
      status: "done",
      sessionId: id,
    });

    await deleteSession(id);

    const slot = await db.planSessions.get("slot");
    expect(slot?.status).toBe("planned");
    expect(slot?.sessionId).toBeUndefined();
  });
});

describe("saveReflection", () => {
  it("updates a reflection in place and keeps its createdAt", async () => {
    const id = await saveReflection({
      sessionId: null,
      date: "2026-01-05",
      scores: { Crimp: -2 },
      confidence: 3,
      notes: "First pass",
    });
    const original = await db.reflections.get(id);

    await saveReflection(
      {
        sessionId: null,
        date: "2026-01-05",
        scores: { Crimp: 1, Powerful: 2 },
        confidence: 3,
        notes: "Edited",
      },
      id,
    );

    const edited = await db.reflections.get(id);
    expect(await db.reflections.count()).toBe(1);
    expect(edited?.scores).toEqual({ Crimp: 1, Powerful: 2 });
    expect(edited?.notes).toBe("Edited");
    expect(edited?.createdAt).toBe(original?.createdAt);
  });
});

describe("backup round-trip", () => {
  it("restores every table exactly as exported", async () => {
    const now = new Date().toISOString();
    const id = await saveSession(session, [ascent]);
    await saveReflection({
      sessionId: id,
      date: session.date,
      scores: { Crimp: 1 },
      confidence: 3,
      notes: "Round trip",
    });
    await db.profile.put({
      id: "me",
      name: "Alex",
      email: "",
      disciplines: ["bouldering"],
      goal: "V5",
      gradeSystem: "v",
      units: "metric",
      weeklyGoal: 3,
      createdAt: now,
    });
    await db.plans.put({
      id: "plan",
      name: "Test plan",
      discipline: "bouldering",
      targetGrade: "V5",
      weeks: 4,
      daysPerWeek: 2,
      startDate: "2026-01-05",
      status: "active",
      createdAt: now,
    });
    await db.planSessions.put({
      id: "plan-session",
      planId: "plan",
      week: 1,
      day: 1,
      title: "Technique",
      type: "technique",
      durationMin: 60,
      intensity: "easy",
      status: "planned",
    });
    await db.contentProgress.put({ contentId: "intro-crimps", status: "done", updatedAt: now });

    const before = await readAllTables();
    const backup = await exportAll();
    await db.delete();
    await db.open();

    const count = await importAll(backup);
    expect(count).toBe(7);
    expect(await readAllTables()).toEqual(before);
    expect(await db.sessions.count()).toBe(1);
    expect(await db.ascents.count()).toBe(1);
    expect(await db.reflections.count()).toBe(1);
    expect(await db.plans.count()).toBe(1);
    expect(await db.planSessions.count()).toBe(1);
    expect(await db.contentProgress.count()).toBe(1);
  });

  it("rejects files that are not CruxCoach backups", async () => {
    await expect(importAll(JSON.stringify({ hello: "world" }))).rejects.toThrow();
  });
});
