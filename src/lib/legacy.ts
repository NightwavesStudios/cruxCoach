import { gradeNumberFromLegacy } from "./grades";
import { makeId } from "./id";
import {
  DISCIPLINE_SYSTEM,
  type Ascent,
  type AscentStyle,
  type Discipline,
  type Profile,
  type Reflection,
  type Session,
  type TraitKey,
} from "./types";

export interface LegacyJournalEntry {
  type?: string;
  timestamp?: string;
  discipline?: string;
  grade?: string;
  difficulty?: string;
  trainingType?: string;
  struggles?: { trait?: string; value?: number }[];
  strengths?: { trait?: string; value?: number }[];
  comments?: string;
}

export interface LegacySnapshot {
  grades?: Record<string, string>;
  accountInfo?: { username?: string; email?: string; joinDate?: string };
  traits?: Record<string, number>;
  journalData?: LegacyJournalEntry[];
  gradeLogs?: Record<string, { grades?: number[]; type?: string }>;
}

export interface LegacyReport {
  sessions: number;
  ascents: number;
  reflections: number;
  skipped: number;
  keys: string[];
}

export interface LegacyConversion {
  profile: Partial<Profile>;
  sessions: Session[];
  ascents: Ascent[];
  reflections: Reflection[];
  report: LegacyReport;
}

const LEGACY_KEYS = ["grades", "accountInfo", "traits", "journalData", "trainingData"];

export function readLegacySnapshot(): LegacySnapshot | null {
  if (typeof localStorage === "undefined") return null;
  const snapshot: LegacySnapshot = {};
  const keys: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (!LEGACY_KEYS.includes(key) && !key.endsWith("Grades")) continue;
    keys.push(key);
    try {
      const value = JSON.parse(localStorage.getItem(key) ?? "null");
      if (value === null) continue;
      if (key === "grades") snapshot.grades = value;
      else if (key === "accountInfo") snapshot.accountInfo = value;
      else if (key === "traits") snapshot.traits = value;
      else if (key === "journalData") snapshot.journalData = value;
      else if (key.endsWith("Grades")) {
        snapshot.gradeLogs ??= {};
        snapshot.gradeLogs[key] = value;
      }
    } catch {
      // Ignore corrupt legacy keys; the report will show what was imported.
    }
  }

  if (keys.length === 0) return null;
  (snapshot as LegacySnapshot & { _keys?: string[] })._keys = keys;
  return snapshot;
}

export function hasLegacyData(): boolean {
  return readLegacySnapshot() !== null;
}

function disciplineFrom(value?: string): Discipline {
  if (value === "toprope") return "toprope";
  if (value === "lead") return "lead";
  if (value === "training") return "training";
  return "bouldering";
}

function styleFrom(difficulty?: string): AscentStyle {
  if (difficulty === "project") return "project";
  if (difficulty === "flash") return "flash";
  if (difficulty === "onsight") return "onsight";
  return "repeat";
}

function isoDate(timestamp?: string, fallback = new Date()): string {
  if (timestamp) {
    const parsed = new Date(timestamp);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return fallback.toISOString();
}

export function convertLegacy(snapshot: LegacySnapshot, now = new Date()): LegacyConversion {
  const sessions: Session[] = [];
  const ascents: Ascent[] = [];
  const reflections: Reflection[] = [];
  let skipped = 0;
  const importedDisciplines = new Set<Discipline>();

  for (const entry of snapshot.journalData ?? []) {
    if (!entry || typeof entry !== "object") {
      skipped += 1;
      continue;
    }
    const timestamp = isoDate(entry.timestamp, now);
    const date = timestamp.slice(0, 10);
    const id = makeId();

    if (entry.type === "climbing") {
      const discipline = disciplineFrom(entry.discipline);
      const system = DISCIPLINE_SYSTEM[discipline];
      const grade = gradeNumberFromLegacy(entry.grade ?? "", system);
      sessions.push({
        id,
        date,
        discipline,
        durationMin: 60,
        rpe: 0,
        location: "",
        notes: "Imported from the previous CruxCoach version.",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      importedDisciplines.add(discipline);
      if (grade !== null) {
        ascents.push({
          id: makeId(),
          sessionId: id,
          grade,
          system,
          style: styleFrom(entry.difficulty),
          attempts: 1,
          sent: entry.difficulty !== "project",
        });
      } else {
        skipped += 1;
      }
    } else if (entry.type === "training") {
      sessions.push({
        id,
        date,
        discipline: "training",
        durationMin: 60,
        rpe: 0,
        location: "",
        notes: entry.trainingType
          ? `Imported training: ${entry.trainingType}`
          : "Imported training session.",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      importedDisciplines.add("training");
    } else if (entry.type === "reflection") {
      const scores: Partial<Record<TraitKey, number>> = {};
      for (const item of [...(entry.struggles ?? []), ...(entry.strengths ?? [])]) {
        if (!item?.trait || typeof item.value !== "number") continue;
        scores[item.trait as TraitKey] = Math.max(-2, Math.min(2, item.value));
      }
      reflections.push({
        id: makeId(),
        sessionId: null,
        date,
        scores,
        confidence: 3,
        notes: entry.comments ?? "Imported reflection.",
        createdAt: timestamp,
      });
    } else {
      skipped += 1;
    }
  }

  if (reflections.length === 0 && snapshot.traits) {
    const scores: Partial<Record<TraitKey, number>> = {};
    for (const [trait, value] of Object.entries(snapshot.traits)) {
      if (!value) continue;
      const scaled = Math.max(-2, Math.min(2, Math.sign(value) * Math.max(1, Math.round(Math.abs(value) / 5))));
      scores[trait as TraitKey] = scaled;
    }
    if (Object.keys(scores).length > 0) {
      reflections.push({
        id: makeId(),
        sessionId: null,
        date: now.toISOString().slice(0, 10),
        scores,
        confidence: 3,
        notes: "Imported from your previous strength and struggle scores.",
        createdAt: now.toISOString(),
      });
    }
  }

  if (snapshot.grades) {
    const baseline: { key: string; label: string; discipline: Discipline }[] = [
      { key: "boulderingFlash", label: "Flash", discipline: "bouldering" },
      { key: "boulderingProject", label: "Project", discipline: "bouldering" },
      { key: "ropedOnsight", label: "Onsight", discipline: "lead" },
      { key: "ropedRedpoint", label: "Redpoint", discipline: "lead" },
    ];

    const grouped = new Map<Discipline, { label: string; grade: number }[]>();
    for (const item of baseline) {
      const gradeText = snapshot.grades[item.key];
      if (!gradeText || gradeText === "None" || importedDisciplines.has(item.discipline)) continue;
      const grade = gradeNumberFromLegacy(gradeText, DISCIPLINE_SYSTEM[item.discipline]);
      if (grade === null) continue;
      const list = grouped.get(item.discipline) ?? [];
      list.push({ label: item.label, grade });
      grouped.set(item.discipline, list);
    }

    for (const [discipline, levels] of grouped) {
      const timestamp = now.toISOString();
      const id = makeId();
      const system = DISCIPLINE_SYSTEM[discipline];
      sessions.push({
        id,
        date: timestamp.slice(0, 10),
        discipline,
        durationMin: 60,
        rpe: 0,
        location: "",
        notes: "Imported baseline from your previous average grades.",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      for (const level of levels) {
        ascents.push({
          id: makeId(),
          sessionId: id,
          grade: level.grade,
          system,
          style:
            level.label === "Onsight"
              ? "onsight"
              : level.label === "Flash"
                ? "flash"
                : level.label === "Project"
                  ? "project"
                  : "repeat",
          attempts: 1,
          sent: level.label !== "Project",
        });
      }
      importedDisciplines.add(discipline);
    }
  }

  const profile: Partial<Profile> = {};
  if (snapshot.accountInfo?.username) profile.name = snapshot.accountInfo.username;
  if (snapshot.accountInfo?.email) profile.email = snapshot.accountInfo.email;
  if (importedDisciplines.size > 0) {
    profile.disciplines = [...importedDisciplines];
  }

  return {
    profile,
    sessions,
    ascents,
    reflections,
    report: {
      sessions: sessions.length,
      ascents: ascents.length,
      reflections: reflections.length,
      skipped,
      keys: [],
    },
  };
}
