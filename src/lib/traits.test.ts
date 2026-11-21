import { describe, expect, it } from "vitest";
import { computeTraitScores, confidenceFor, focusAreas } from "./traits";
import type { Reflection } from "./types";

const now = new Date("2026-01-01T12:00:00Z");

function reflection(daysAgo: number, scores: Reflection["scores"]): Reflection {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return {
    id: String(daysAgo),
    sessionId: null,
    date: date.toISOString().slice(0, 10),
    scores,
    confidence: 3,
    notes: "",
    createdAt: date.toISOString(),
  };
}

describe("computeTraitScores", () => {
  it("weights recent reflections more heavily", () => {
    const scores = computeTraitScores(
      [reflection(5, { Crimp: -2 }), reflection(120, { Crimp: 2 })],
      now,
    );
    const crimp = scores.find((score) => score.key === "Crimp");
    expect(crimp?.raw).toBeLessThan(0);
    expect(crimp?.samples).toBe(2);
  });

  it("clamps scores and exposes a confidence state", () => {
    const scores = computeTraitScores(
      [
        reflection(1, { Sloper: 2 }),
        reflection(2, { Sloper: 1 }),
        reflection(3, { Sloper: -1 }),
      ],
      now,
    );
    const sloper = scores.find((score) => score.key === "Sloper");
    expect(sloper?.score).toBeGreaterThanOrEqual(-100);
    expect(sloper?.score).toBeLessThanOrEqual(100);
    expect(sloper?.confidence).toBe("developing");
  });

  it("ignores zero and missing values", () => {
    const scores = computeTraitScores([reflection(1, { Crimp: 0 })], now);
    expect(scores.find((score) => score.key === "Crimp")?.samples).toBe(0);
  });
});

describe("confidenceFor", () => {
  it("steps from learning to established", () => {
    expect(confidenceFor(1)).toBe("learning");
    expect(confidenceFor(3)).toBe("developing");
    expect(confidenceFor(6)).toBe("established");
  });
});

describe("focusAreas", () => {
  it("returns the lowest rated traits once data is established", () => {
    const scores = computeTraitScores(
      [
        reflection(1, { Crimp: -2, Sloper: 1, Powerful: -1 }),
        reflection(2, { Crimp: -2, Sloper: 1, Powerful: -1 }),
        reflection(3, { Crimp: -2, Sloper: 1, Powerful: -1 }),
      ],
      now,
    );
    const focus = focusAreas(scores, 2);
    expect(focus.map((score) => score.key)).toEqual(["Crimp", "Powerful"]);
  });

  it("stays empty while confidence is low", () => {
    const scores = computeTraitScores([reflection(1, { Crimp: -2 })], now);
    expect(focusAreas(scores)).toEqual([]);
  });
});
