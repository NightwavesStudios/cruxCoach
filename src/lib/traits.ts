import { TRAITS, type Confidence, type Reflection, type TraitGroup, type TraitKey } from "./types";

export interface TraitScore {
  key: TraitKey;
  label: string;
  group: TraitGroup;
  raw: number;
  score: number;
  samples: number;
  confidence: Confidence;
}

const HALF_LIFE_DAYS = 45;
const DAY_MS = 86_400_000;

export function confidenceFor(samples: number): Confidence {
  if (samples < 3) return "learning";
  if (samples < 6) return "developing";
  return "established";
}

export function computeTraitScores(
  reflections: Reflection[],
  now: Date = new Date(),
): TraitScore[] {
  const totals = new Map<TraitKey, { weighted: number; weight: number; samples: number }>();

  for (const reflection of reflections) {
    const timestamp = Date.parse(reflection.date);
    if (Number.isNaN(timestamp)) continue;
    const ageDays = Math.max(0, (now.getTime() - timestamp) / DAY_MS);
    const weight = Math.pow(0.5, ageDays / HALF_LIFE_DAYS);

    for (const trait of TRAITS) {
      const value = reflection.scores[trait.key];
      if (typeof value !== "number" || value === 0) continue;
      const clamped = Math.max(-2, Math.min(2, value));
      const total = totals.get(trait.key) ?? { weighted: 0, weight: 0, samples: 0 };
      total.weighted += clamped * weight;
      total.weight += weight;
      total.samples += 1;
      totals.set(trait.key, total);
    }
  }

  const reflectionCount = reflections.filter((item) => !Number.isNaN(Date.parse(item.date))).length;
  const confidence = confidenceFor(reflectionCount);

  return TRAITS.map((trait) => {
    const total = totals.get(trait.key);
    const raw = total && total.weight > 0 ? total.weighted / total.weight : 0;
    return {
      key: trait.key,
      label: trait.label,
      group: trait.group,
      raw,
      score: Math.round((raw / 2) * 100),
      samples: total?.samples ?? 0,
      confidence,
    };
  });
}

export function focusAreas(scores: TraitScore[], limit = 3): TraitScore[] {
  const rated = scores.filter((score) => score.samples > 0);
  if (rated.length === 0 || rated.every((score) => score.confidence === "learning")) {
    return [];
  }
  return [...rated].sort((a, b) => a.raw - b.raw).slice(0, limit);
}

export function traitLabel(key: string): string {
  return TRAITS.find((trait) => trait.key === key)?.label ?? key;
}

export function traitTag(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();
}
