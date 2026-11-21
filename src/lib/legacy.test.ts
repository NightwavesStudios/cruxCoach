import { describe, expect, it } from "vitest";
import { convertLegacy, type LegacySnapshot } from "./legacy";

const now = new Date("2026-01-10T10:00:00Z");

function convert(snapshot: LegacySnapshot) {
  return convertLegacy(snapshot, now);
}

describe("convertLegacy", () => {
  it("maps old climbing logs into sessions and ascents", () => {
    const result = convert({
      journalData: [
        {
          type: "climbing",
          discipline: "bouldering",
          grade: "V5",
          difficulty: "flash",
          timestamp: "2025-11-01T18:00:00.000Z",
        },
        {
          type: "climbing",
          discipline: "lead",
          grade: "5.11c",
          difficulty: "project",
          timestamp: "2025-11-02T18:00:00.000Z",
        },
      ],
    });

    expect(result.sessions).toHaveLength(2);
    expect(result.ascents).toHaveLength(2);
    expect(result.ascents[0]).toMatchObject({ grade: 6, system: "v", style: "flash", sent: true });
    expect(result.ascents[1]).toMatchObject({ grade: 11, system: "yds", sent: false });
    expect(result.sessions[0].date).toBe("2025-11-01");
  });

  it("imports reflections and keeps comments", () => {
    const result = convert({
      journalData: [
        {
          type: "reflection",
          timestamp: "2025-11-03T18:00:00.000Z",
          struggles: [{ trait: "Crimp", value: -2 }],
          strengths: [{ trait: "Slab", value: 1 }],
          comments: "Felt strong on slabs.",
        },
      ],
    });

    expect(result.reflections).toHaveLength(1);
    expect(result.reflections[0].scores).toEqual({ Crimp: -2, Slab: 1 });
    expect(result.reflections[0].notes).toBe("Felt strong on slabs.");
  });

  it("falls back to accumulated traits when there are no reflections", () => {
    const result = convert({ traits: { Crimp: -9, Sloper: 6 } });
    expect(result.reflections).toHaveLength(1);
    expect(result.reflections[0].scores.Crimp).toBe(-2);
    expect(result.reflections[0].scores.Sloper).toBe(1);
  });

  it("creates a baseline level from old average grades", () => {
    const result = convert({
      grades: {
        boulderingFlash: "V4",
        boulderingProject: "V6",
        ropedOnsight: "5.10c",
        ropedRedpoint: "None",
      },
    });

    expect(result.sessions).toHaveLength(2);
    expect(result.ascents.map((ascent) => ascent.grade)).toEqual([5, 7, 7]);
    expect(result.profile.disciplines).toEqual(["bouldering", "lead"]);
  });

  it("imports account details and reports skipped entries", () => {
    const result = convert({
      accountInfo: { username: "alex", email: "alex@example.com" },
      journalData: [{ type: "unknown" }],
    });

    expect(result.profile).toMatchObject({ name: "alex", email: "alex@example.com" });
    expect(result.report.skipped).toBe(1);
  });
});
