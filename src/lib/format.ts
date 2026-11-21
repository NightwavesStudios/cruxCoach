import type { Units } from "./types";

export function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function percent(value: number): string {
  return `${Math.round(value)}%`;
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export type MetricKind = "weight" | "height" | "distance";

const METRICS: Record<MetricKind, { metric: string; imperial: string; factor: number }> = {
  weight: { metric: "kg", imperial: "lb", factor: 2.2046226218 },
  height: { metric: "cm", imperial: "in", factor: 0.3937007874 },
  distance: { metric: "km", imperial: "mi", factor: 0.6213711922 },
};

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Canonical metric value shown in the chosen units. */
export function toDisplayValue(kind: MetricKind, canonical: number, units: Units): number {
  return round1(units === "imperial" ? canonical * METRICS[kind].factor : canonical);
}

/** A value typed in the chosen units, stored as canonical metric. */
export function toCanonicalValue(kind: MetricKind, value: number, units: Units): number {
  return round2(units === "imperial" ? value / METRICS[kind].factor : value);
}

export function formatMetric(kind: MetricKind, canonical: number, units: Units): string {
  const unit = METRICS[kind][units === "imperial" ? "imperial" : "metric"];
  return `${toDisplayValue(kind, canonical, units)} ${unit}`;
}
