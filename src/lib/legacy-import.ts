import { db, defaultProfile, getProfile } from "./db";
import { convertLegacy, readLegacySnapshot, type LegacyReport } from "./legacy";

export async function importLegacy(): Promise<LegacyReport | null> {
  const snapshot = readLegacySnapshot();
  if (!snapshot) return null;

  const conversion = convertLegacy(snapshot);
  const existing = await getProfile();
  const now = new Date().toISOString();

  await db.transaction(
    "rw",
    [db.profile, db.sessions, db.ascents, db.reflections],
    async () => {
      if (conversion.sessions.length) await db.sessions.bulkPut(conversion.sessions);
      if (conversion.ascents.length) await db.ascents.bulkPut(conversion.ascents);
      if (conversion.reflections.length) await db.reflections.bulkPut(conversion.reflections);
      await db.profile.put({
        ...defaultProfile(),
        ...existing,
        ...conversion.profile,
        id: "me",
        legacyImportedAt: now,
      });
    },
  );

  return conversion.report;
}
