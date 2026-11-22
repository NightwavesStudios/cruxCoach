export interface PersistentStorage {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
}

export const BACKUP_INTERVAL_DAYS = 30;

/** Ask the browser to keep this origin's data when space is tight. Returns whether it agreed. */
export async function requestPersistentStorage(
  storage: PersistentStorage | undefined = globalThis.navigator?.storage,
): Promise<boolean> {
  if (!storage?.persist) return false;
  try {
    if (storage.persisted && (await storage.persisted())) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}

export function daysSinceBackup(lastBackupAt: string | undefined, now = new Date()): number | null {
  if (!lastBackupAt) return null;
  const then = Date.parse(lastBackupAt);
  if (Number.isNaN(then)) return null;
  return Math.floor((now.getTime() - then) / 86_400_000);
}

/** A line to show in the data panel, or null when the last backup is recent enough. */
export function backupReminder(options: {
  hasData: boolean;
  lastBackupAt?: string;
  now?: Date;
}): string | null {
  if (!options.hasData) return null;
  const days = daysSinceBackup(options.lastBackupAt, options.now);
  if (days === null) {
    return "No backup yet. Download one so a cleared browser cannot take this logbook with it.";
  }
  if (days < BACKUP_INTERVAL_DAYS) return null;
  return `Last backup was ${days} days ago. Download a fresh one.`;
}
