import { describe, expect, it } from "vitest";
import {
  convertGrade,
  displayGrade,
  formatGrade,
  fromCanonical,
  gradeNumberFromLegacy,
  median,
  parseGrade,
  toCanonical,
} from "./grades";

describe("parseGrade", () => {
  it("parses V-scale grades", () => {
    expect(parseGrade("VB", "v")).toBe(0);
    expect(parseGrade("V4", "v")).toBe(5);
    expect(parseGrade("v10", "v")).toBe(11);
  });

  it("parses YDS grades, including letterless shorthand", () => {
    expect(parseGrade("5.9", "yds")).toBe(4);
    expect(parseGrade("5.11c", "yds")).toBe(11);
    expect(parseGrade("5.10", "yds")).toBe(5);
  });

  it("rejects invalid grades", () => {
    expect(parseGrade("V99", "v")).toBeNull();
    expect(parseGrade("hello", "yds")).toBeNull();
  });
});

describe("formatGrade", () => {
  it("formats each system", () => {
    expect(formatGrade(5, "v")).toBe("V4");
    expect(formatGrade(11, "yds")).toBe("5.11c");
    expect(formatGrade(-3, "v")).toBe("VB");
  });
});

describe("cross-system conversion", () => {
  it("maps YDS indexes to a canonical scale and back", () => {
    const canonical = toCanonical(13, "yds");
    expect(canonical).toBe(8);
    expect(fromCanonical(canonical, "yds")).toBe(13);
  });
});

describe("preferred grade system", () => {
  it("keeps grades in their own system and converts only across systems", () => {
    expect(convertGrade(5, "v", "v")).toBe(5);
    expect(convertGrade(5, "v", "yds")).toBe(7);
    expect(displayGrade(5, "v", "yds")).toBe("5.10c");
    expect(displayGrade(13, "yds", "v")).toBe("V7");
  });
});

describe("median", () => {
  it("handles odd and even samples", () => {
    expect(median([5, 3, 4])).toBe(4);
    expect(median([3, 4, 5, 6])).toBe(4.5);
    expect(median([])).toBeNaN();
  });
});

describe("gradeNumberFromLegacy", () => {
  it("parses legacy rope and boulder strings", () => {
    expect(gradeNumberFromLegacy("5.11c", "yds")).toBe(11);
    expect(gradeNumberFromLegacy("V5", "v")).toBe(6);
    expect(gradeNumberFromLegacy("None", "v")).toBeNull();
  });
});
