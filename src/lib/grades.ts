import type { GradeSystem } from "./types";

export const V_GRADES = [
  "VB", "V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8",
  "V9", "V10", "V11", "V12", "V13", "V14", "V15", "V16", "V17",
];

export const YDS_GRADES = [
  "5.5", "5.6", "5.7", "5.8", "5.9",
  "5.10a", "5.10b", "5.10c", "5.10d",
  "5.11a", "5.11b", "5.11c", "5.11d",
  "5.12a", "5.12b", "5.12c", "5.12d",
  "5.13a", "5.13b", "5.13c", "5.13d",
  "5.14a", "5.14b", "5.14c", "5.14d",
  "5.15a", "5.15b", "5.15c", "5.15d",
];

/** Rough cross-discipline index used for trends only, never displayed as equivalence. */
const YDS_TO_V = [
  0, 1, 2, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9,
  9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 15, 15, 16, 17,
];

export function gradesFor(system: GradeSystem): string[] {
  return system === "v" ? V_GRADES : YDS_GRADES;
}

export function parseGrade(input: string, system: GradeSystem): number | null {
  const raw = input.trim().replace(/\s+/g, "");
  if (!raw) return null;

  if (system === "v") {
    const value = raw.toUpperCase();
    if (value === "VB" || value === "VB0") return 0;
    const match = value.match(/^V(\d{1,2})$/);
    if (!match) return null;
    const index = Number(match[1]) + 1;
    return index < V_GRADES.length ? index : null;
  }

  const value = raw.toLowerCase();
  const index = YDS_GRADES.indexOf(value);
  if (index >= 0) return index;
  const letterless = value.match(/^5\.(\d{1,2})$/);
  if (letterless) {
    return YDS_GRADES.indexOf(`5.${letterless[1]}a`);
  }
  return null;
}

export function formatGrade(index: number, system: GradeSystem): string {
  if (!Number.isFinite(index)) return "—";
  const list = gradesFor(system);
  const rounded = Math.round(index);
  return list[Math.max(0, Math.min(list.length - 1, rounded))] ?? "—";
}

export function toCanonical(index: number, system: GradeSystem): number {
  if (system === "v") return index;
  return YDS_TO_V[index] ?? 0;
}

export function fromCanonical(canonical: number, system: GradeSystem): number {
  if (system === "v") return canonical;
  let best = 0;
  let distance = Infinity;
  YDS_TO_V.forEach((value, index) => {
    const next = Math.abs(value - canonical);
    if (next <= distance) {
      best = index;
      distance = next;
    }
  });
  return best;
}

/** The same climb expressed in another grading system. */
export function convertGrade(index: number, from: GradeSystem, to: GradeSystem): number {
  if (from === to) return index;
  return fromCanonical(toCanonical(index, from), to);
}

export function displayGrade(index: number, from: GradeSystem, preferred: GradeSystem): string {
  return formatGrade(convertGrade(index, from, preferred), preferred);
}

export function median(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function gradeOptions(system: GradeSystem): { value: number; label: string }[] {
  return gradesFor(system).map((label, value) => ({ value, label }));
}

export function gradeNumberFromLegacy(grade: string, system: GradeSystem): number | null {
  const parsed = parseGrade(grade, system);
  if (parsed !== null) return parsed;
  const loose = grade.trim().toUpperCase();
  const vMatch = loose.match(/^V(\d{1,2})$/);
  if (vMatch) return parseGrade(`V${vMatch[1]}`, "v");
  const ydsMatch = loose.match(/^5\.(\d{1,2})([A-D])?$/);
  if (ydsMatch) {
    return parseGrade(`5.${ydsMatch[1]}${(ydsMatch[2] ?? "A").toLowerCase()}`, "yds");
  }
  return null;
}
