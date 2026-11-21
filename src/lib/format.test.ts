import { describe, expect, it } from "vitest";
import { formatMetric, toCanonicalValue, toDisplayValue } from "./format";

describe("unit display", () => {
  it("shows canonical metric values in the chosen units", () => {
    expect(toDisplayValue("weight", 72, "metric")).toBe(72);
    expect(toDisplayValue("weight", 72, "imperial")).toBe(158.7);
    expect(toDisplayValue("height", 178, "imperial")).toBe(70.1);
    expect(toDisplayValue("distance", 1.6, "imperial")).toBe(1);
  });

  it("stores values typed in the chosen units as canonical metric", () => {
    expect(toCanonicalValue("weight", 159, "imperial")).toBe(72.12);
    expect(toCanonicalValue("height", 70, "imperial")).toBe(177.8);
    expect(toCanonicalValue("distance", 1, "imperial")).toBe(1.61);
    expect(toCanonicalValue("distance", 2.4, "metric")).toBe(2.4);
  });

  it("labels formatted values with the active unit", () => {
    expect(formatMetric("weight", 72, "metric")).toBe("72 kg");
    expect(formatMetric("weight", 72, "imperial")).toBe("158.7 lb");
    expect(formatMetric("height", 178, "imperial")).toBe("70.1 in");
    expect(formatMetric("distance", 1.6, "imperial")).toBe("1 mi");
  });
});
