import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { importLegacy } from "./legacy-import";

const storage = {
  data: new Map<string, string>(),
  get length() {
    return this.data.size;
  },
  clear() {
    this.data.clear();
  },
  getItem(key: string) {
    return this.data.get(key) ?? null;
  },
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  },
  removeItem(key: string) {
    this.data.delete(key);
  },
  setItem(key: string, value: string) {
    this.data.set(key, value);
  },
};

beforeEach(async () => {
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
  storage.clear();
  await db.delete();
  await db.open();
});

async function counts() {
  return {
    sessions: await db.sessions.count(),
    ascents: await db.ascents.count(),
    reflections: await db.reflections.count(),
  };
}

const journalData = [
  {
    type: "climbing",
    discipline: "bouldering",
    grade: "V5",
    difficulty: "flash",
    timestamp: "2025-11-01T18:00:00.000Z",
  },
  {
    type: "reflection",
    timestamp: "2025-11-01T19:00:00.000Z",
    struggles: [{ trait: "Crimp", value: -1 }],
    comments: "Fingers felt weak.",
  },
];

describe("importLegacy", () => {
  it("imports once and leaves the counts untouched on a second run", async () => {
    storage.setItem("accountInfo", JSON.stringify({ username: "alex" }));
    storage.setItem("journalData", JSON.stringify(journalData));

    const first = await importLegacy();
    if (first.status !== "imported") throw new Error("expected the first import to run");
    expect(first.report).toMatchObject({ sessions: 1, ascents: 1, reflections: 1 });

    const afterFirst = await counts();
    expect(afterFirst).toEqual({ sessions: 1, ascents: 1, reflections: 1 });
    expect((await db.profile.get("me"))?.name).toBe("alex");
    expect((await db.profile.get("me"))?.legacyImportedAt).toBeTruthy();

    const second = await importLegacy();
    expect(second).toEqual({ status: "already-imported" });
    expect(await counts()).toEqual(afterFirst);
    expect(await db.profile.count()).toBe(1);
    expect(storage.getItem("journalData")).not.toBeNull();
  });

  it("refuses to run when the profile already carries an import timestamp", async () => {
    storage.setItem("journalData", JSON.stringify(journalData));
    await db.profile.put({
      id: "me",
      name: "alex",
      email: "",
      disciplines: ["bouldering"],
      goal: "",
      gradeSystem: "v",
      units: "metric",
      weeklyGoal: 3,
      createdAt: "2026-01-01T00:00:00.000Z",
      legacyImportedAt: "2026-01-02T00:00:00.000Z",
    });

    expect(await importLegacy()).toEqual({ status: "already-imported" });
    expect(await counts()).toEqual({ sessions: 0, ascents: 0, reflections: 0 });
  });

  it("reports when there is nothing old to bring across", async () => {
    expect(await importLegacy()).toEqual({ status: "no-data" });
    expect(await counts()).toEqual({ sessions: 0, ascents: 0, reflections: 0 });
  });
});
