import Dexie, { type EntityTable } from "dexie";
import { z } from "zod";
import { makeId } from "./id";
import type {
  Ascent,
  ContentProgress,
  Plan,
  PlanSession,
  Profile,
  Reflection,
  Session,
} from "./types";

class CruxCoachDB extends Dexie {
  profile!: EntityTable<Profile, "id">;
  sessions!: EntityTable<Session, "id">;
  ascents!: EntityTable<Ascent, "id">;
  reflections!: EntityTable<Reflection, "id">;
  plans!: EntityTable<Plan, "id">;
  planSessions!: EntityTable<PlanSession, "id">;
  contentProgress!: EntityTable<ContentProgress, "contentId">;

  constructor() {
    super("cruxcoach");
    // Single schema for the whole app. Any object store missing from this list is
    // deleted on upgrade, so removing a store only needs a version bump.
    this.version(2).stores({
      profile: "id",
      sessions: "id, date, discipline",
      ascents: "id, sessionId",
      reflections: "id, sessionId, date",
      plans: "id, status, startDate",
      planSessions: "id, planId, week, status",
      contentProgress: "contentId, status",
    });
  }
}

export const db = new CruxCoachDB();

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultProfile(): Profile {
  return {
    id: "me",
    name: "",
    email: "",
    disciplines: ["bouldering"],
    goal: "",
    gradeSystem: "v",
    units: "metric",
    createdAt: new Date().toISOString(),
  };
}

export async function getProfile(): Promise<Profile> {
  return (await db.profile.get("me")) ?? defaultProfile();
}

export async function saveSession(
  session: Omit<Session, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ascents: Omit<Ascent, "id" | "sessionId">[],
  replaceId?: string,
): Promise<string> {
  const id = replaceId ?? session.id ?? makeId();
  const now = new Date().toISOString();
  const existing = replaceId ? await db.sessions.get(replaceId) : undefined;

  await db.transaction("rw", db.sessions, db.ascents, async () => {
    await db.sessions.put({
      ...session,
      id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    if (replaceId) {
      await db.ascents.where("sessionId").equals(id).delete();
    }
    await db.ascents.bulkPut(
      ascents.map((ascent) => ({ ...ascent, id: makeId(), sessionId: id })),
    );
  });

  return id;
}

export async function saveReflection(
  reflection: Omit<Reflection, "id" | "createdAt"> & { id?: string },
  replaceId?: string,
): Promise<string> {
  const id = replaceId ?? reflection.id ?? makeId();
  const existing = replaceId ? await db.reflections.get(replaceId) : undefined;

  await db.reflections.put({
    ...reflection,
    id,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });

  return id;
}

export async function deleteSession(id: string): Promise<void> {
  await db.transaction("rw", db.sessions, db.ascents, db.reflections, async () => {
    await db.sessions.delete(id);
    await db.ascents.where("sessionId").equals(id).delete();
    await db.reflections.where("sessionId").equals(id).delete();
  });
}

const importSchema = z.object({
  _meta: z.object({
    source: z.literal("cruxcoach-app"),
    version: z.number(),
  }),
  tables: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))),
});

export async function exportAll(): Promise<string> {
  const tables = {
    profile: await db.profile.toArray(),
    sessions: await db.sessions.toArray(),
    ascents: await db.ascents.toArray(),
    reflections: await db.reflections.toArray(),
    plans: await db.plans.toArray(),
    planSessions: await db.planSessions.toArray(),
    contentProgress: await db.contentProgress.toArray(),
  };
  const payload = {
    _meta: {
      source: "cruxcoach-app",
      version: 1,
      exportedAt: new Date().toISOString(),
    },
    tables,
  };
  return JSON.stringify(payload, null, 2);
}

export async function importAll(text: string): Promise<number> {
  const parsed = importSchema.parse(JSON.parse(text));
  const tables = parsed.tables as Record<string, Record<string, unknown>[]>;
  let count = 0;

  await db.transaction(
    "rw",
    [
      db.profile,
      db.sessions,
      db.ascents,
      db.reflections,
      db.plans,
      db.planSessions,
      db.contentProgress,
    ],
    async () => {
      await Promise.all([
        db.profile.clear(),
        db.sessions.clear(),
        db.ascents.clear(),
        db.reflections.clear(),
        db.plans.clear(),
        db.planSessions.clear(),
        db.contentProgress.clear(),
      ]);

      for (const [name, rows] of Object.entries(tables)) {
        const table = (db as unknown as Record<string, { bulkPut: (rows: unknown[]) => Promise<unknown> }>)[name];
        if (!table) continue;
        await table.bulkPut(rows);
        count += rows.length;
      }
    },
  );

  return count;
}

export async function clearAll(): Promise<void> {
  await db.delete();
  window.location.reload();
}
