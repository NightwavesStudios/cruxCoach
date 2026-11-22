import { describe, expect, it } from "vitest";
import {
  BACKUP_INTERVAL_DAYS,
  backupReminder,
  daysSinceBackup,
  requestPersistentStorage,
} from "./storage";

const now = new Date("2026-03-01T12:00:00.000Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

describe("backupReminder", () => {
  it("says nothing before there is data to lose", () => {
    expect(backupReminder({ hasData: false, now })).toBeNull();
    expect(backupReminder({ hasData: false, lastBackupAt: daysAgo(90), now })).toBeNull();
  });

  it("asks for a first backup", () => {
    expect(backupReminder({ hasData: true, now })).toMatch(/No backup yet/);
  });

  it("stays quiet while the last backup is recent", () => {
    expect(
      backupReminder({ hasData: true, lastBackupAt: daysAgo(BACKUP_INTERVAL_DAYS - 1), now }),
    ).toBeNull();
    expect(backupReminder({ hasData: true, lastBackupAt: daysAgo(0), now })).toBeNull();
  });

  it("asks again once the backup is a month old", () => {
    expect(backupReminder({ hasData: true, lastBackupAt: daysAgo(45), now })).toContain("45 days");
  });

  it("treats an unreadable date as no backup", () => {
    expect(backupReminder({ hasData: true, lastBackupAt: "not a date", now })).toMatch(
      /No backup yet/,
    );
    expect(daysSinceBackup("not a date", now)).toBeNull();
    expect(daysSinceBackup(undefined, now)).toBeNull();
  });
});

describe("requestPersistentStorage", () => {
  it("uses an existing grant without asking again", async () => {
    let asked = false;
    const granted = await requestPersistentStorage({
      persisted: async () => true,
      persist: async () => {
        asked = true;
        return true;
      },
    });

    expect(granted).toBe(true);
    expect(asked).toBe(false);
  });

  it("asks when persistence has not been granted", async () => {
    let asked = false;
    const granted = await requestPersistentStorage({
      persisted: async () => false,
      persist: async () => {
        asked = true;
        return true;
      },
    });

    expect(granted).toBe(true);
    expect(asked).toBe(true);
  });

  it("reports best effort when the browser cannot persist", async () => {
    expect(await requestPersistentStorage({})).toBe(false);
    expect(await requestPersistentStorage(undefined)).toBe(false);
  });

  it("does not throw when the browser refuses or fails", async () => {
    expect(
      await requestPersistentStorage({
        persist: async () => {
          throw new Error("denied");
        },
      }),
    ).toBe(false);
    expect(
      await requestPersistentStorage({
        persisted: async () => {
          throw new Error("unavailable");
        },
        persist: async () => true,
      }),
    ).toBe(false);
  });
});
