import { db, defaultProfile, getProfile } from "./db";
import { convertLegacy, readLegacySnapshot, type LegacyReport } from "./legacy";

export type LegacyImportResult =
  | { status: "imported"; report: LegacyReport }
  | { status: "already-imported" }
  | { status: "no-data" };

export async function importLegacy(): Promise<LegacyImportResult> {
  const existing = await getProfile();
  if (existing.legacyImportedAt) return { status: "already-imported" };

  const snapshot = readLegacySnapshot();
  if (!snapshot) return { status: "no-data" };

  const conversion = convertLegacy(snapshot);
  const now = new Date().toISOString();
  let imported = false;

  await db.transaction(
    "rw",
    [db.profile, db.sessions, db.ascents, db.reflections],
    async () => {
      // A second click can arrive while the first import is still writing. The
      // timestamp is checked again inside the transaction so only one run lands.
      const current = await db.profile.get("me");
      if (current?.legacyImportedAt) return;

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
      imported = true;
    },
  );

  return imported
    ? { status: "imported", report: conversion.report }
    : { status: "already-imported" };
}
