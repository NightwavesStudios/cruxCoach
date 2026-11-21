import { formatGrade, toCanonical } from "./grades";
import type { Ascent, Discipline, Environment, GradeSystem, Session } from "./types";

/**
 * Sessions logged before environments existed have no stored value. Outdoor
 * place names are specific enough to separate crag days from gym days without
 * touching the database schema, and anything unrecognised stays indoor.
 */
const OUTDOOR_TERMS = [
  "crag",
  "cliff",
  "outdoors",
  "outside",
  "gritstone",
  "grit",
  "quarry",
  "gorge",
  "outcrop",
  "boulder field",
  "sea cliff",
  "sandstone",
  "limestone",
  "granite",
  "mountain",
  "alps",
  "dolomites",
  "yosemite",
  "fontainebleau",
  "stanage",
  "horseshoe",
  "peak district",
  "sector",
];

export function environmentOf(session: Pick<Session, "environment" | "location">): Environment {
  if (session.environment === "indoor" || session.environment === "outdoor") {
    return session.environment;
  }
  const location = (session.location ?? "").toLowerCase();
  if (!location) return "indoor";
  return OUTDOOR_TERMS.some((term) => location.includes(term)) ? "outdoor" : "indoor";
}

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function isClimbing(session: Session): boolean {
  return session.discipline !== "training";
}

export interface EnvironmentStats {
  environment: Environment;
  sessions: number;
  climbingSessions: number;
  climbs: number;
  sends: number;
  attempts: number;
  sendRate: number;
  flashRate: number;
  hardest: { grade: number; system: GradeSystem } | null;
  avgDuration: number;
  avgRpe: number;
}

export function environmentStats(
  sessions: Session[],
  ascents: Ascent[],
  environment: Environment,
): EnvironmentStats {
  const matching = sessions.filter((session) => environmentOf(session) === environment);
  const sessionIds = new Set(matching.map((session) => session.id));
  const climbs = ascents.filter((ascent) => sessionIds.has(ascent.sessionId));
  const sends = climbs.filter((ascent) => ascent.sent);
  const sessionAscents = new Map<string, Ascent[]>();
  for (const ascent of climbs) {
    const list = sessionAscents.get(ascent.sessionId) ?? [];
    list.push(ascent);
    sessionAscents.set(ascent.sessionId, list);
  }

  let hardest: EnvironmentStats["hardest"] = null;
  for (const ascent of sends) {
    const canonical = toCanonical(ascent.grade, ascent.system);
    const current = hardest ? toCanonical(hardest.grade, hardest.system) : -1;
    if (canonical > current) {
      hardest = { grade: ascent.grade, system: ascent.system };
    }
  }

  const durations = matching.filter((session) => session.durationMin > 0).map((session) => session.durationMin);
  const efforts = matching.filter((session) => session.rpe > 0).map((session) => session.rpe);
  const flashes = sends.filter(
    (ascent) => ascent.style === "onsight" || ascent.style === "flash",
  ).length;

  return {
    environment,
    sessions: matching.length,
    climbingSessions: matching.filter(isClimbing).length,
    climbs: climbs.length,
    sends: sends.length,
    attempts: climbs.reduce((sum, ascent) => sum + Math.max(1, ascent.attempts), 0),
    sendRate: percent(sends.length, climbs.length),
    flashRate: percent(flashes, sends.length),
    hardest,
    avgDuration: durations.length
      ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
      : 0,
    avgRpe: efforts.length
      ? Math.round((efforts.reduce((sum, value) => sum + value, 0) / efforts.length) * 10) / 10
      : 0,
  };
}

export interface EnvironmentComparison {
  indoor: EnvironmentStats;
  outdoor: EnvironmentStats;
  /** Indoor send rate minus outdoor send rate, in percentage points. */
  sendRateGap: number | null;
  /** Outdoor hardest grade minus indoor hardest grade, on the canonical index. */
  hardestGap: number | null;
}

export function environmentComparison(
  sessions: Session[],
  ascents: Ascent[],
): EnvironmentComparison {
  const indoor = environmentStats(sessions, ascents, "indoor");
  const outdoor = environmentStats(sessions, ascents, "outdoor");
  return {
    indoor,
    outdoor,
    sendRateGap:
      indoor.climbs > 0 && outdoor.climbs > 0 ? indoor.sendRate - outdoor.sendRate : null,
    hardestGap:
      indoor.hardest && outdoor.hardest
        ? toCanonical(outdoor.hardest.grade, outdoor.hardest.system) -
          toCanonical(indoor.hardest.grade, indoor.hardest.system)
        : null,
  };
}

export interface GradeBand {
  grade: number;
  system: GradeSystem;
  climbs: number;
  sends: number;
  attempts: number;
  rate: number;
}

function ascentsFor(
  sessions: Session[],
  ascents: Ascent[],
  disciplines: Discipline[],
): Ascent[] {
  const sessionIds = new Set(
    sessions
      .filter((session) => disciplines.includes(session.discipline))
      .map((session) => session.id),
  );
  return ascents.filter((ascent) => sessionIds.has(ascent.sessionId));
}

export function gradeBreakdown(
  sessions: Session[],
  ascents: Ascent[],
  disciplines: Discipline[],
): GradeBand[] {
  const groups = new Map<string, GradeBand>();

  for (const ascent of ascentsFor(sessions, ascents, disciplines)) {
    const key = `${ascent.system}:${ascent.grade}`;
    const band =
      groups.get(key) ??
      ({ grade: ascent.grade, system: ascent.system, climbs: 0, sends: 0, attempts: 0, rate: 0 } satisfies GradeBand);
    band.climbs += 1;
    band.attempts += Math.max(1, ascent.attempts);
    if (ascent.sent) band.sends += 1;
    band.rate = percent(band.sends, band.climbs);
    groups.set(key, band);
  }

  return [...groups.values()].sort(
    (a, b) =>
      toCanonical(a.grade, a.system) - toCanonical(b.grade, b.system) ||
      a.system.localeCompare(b.system) ||
      a.grade - b.grade,
  );
}

export interface DayStats {
  day: string;
  sessions: number;
  climbs: number;
  sends: number;
  sendRate: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function weekdayBreakdown(sessions: Session[], ascents: Ascent[]): DayStats[] {
  const buckets = DAYS.map((day) => ({ day, sessions: 0, climbs: 0, sends: 0, sendRate: 0 }));
  const bySession = new Map<string, Ascent[]>();
  for (const ascent of ascents) {
    const list = bySession.get(ascent.sessionId) ?? [];
    list.push(ascent);
    bySession.set(ascent.sessionId, list);
  }

  for (const session of sessions.filter(isClimbing)) {
    if (Number.isNaN(Date.parse(`${session.date}T12:00:00`))) continue;
    const index = (new Date(`${session.date}T12:00:00`).getDay() + 6) % 7;
    const bucket = buckets[index];
    bucket.sessions += 1;
    for (const ascent of bySession.get(session.id) ?? []) {
      bucket.climbs += 1;
      if (ascent.sent) bucket.sends += 1;
    }
  }

  return buckets.map((bucket) => ({
    ...bucket,
    sendRate: percent(bucket.sends, bucket.climbs),
  }));
}

export interface ShapeStats {
  label: string;
  sessions: number;
  climbs: number;
  sends: number;
  sendRate: number;
}

const DURATION_BUCKETS = [
  { label: "Under 60 min", min: 0, max: 59 },
  { label: "60 to 89 min", min: 60, max: 89 },
  { label: "90 to 119 min", min: 90, max: 119 },
  { label: "120 min and over", min: 120, max: Number.POSITIVE_INFINITY },
];

const EFFORT_BUCKETS = [
  { label: "1 to 4", min: 1, max: 4 },
  { label: "5 to 6", min: 5, max: 6 },
  { label: "7 to 8", min: 7, max: 8 },
  { label: "9 to 10", min: 9, max: 10 },
];

function shapeBreakdown(
  sessions: Session[],
  ascents: Ascent[],
  buckets: { label: string; min: number; max: number }[],
  valueOf: (session: Session) => number,
): ShapeStats[] {
  const relevant = sessions.filter((session) => isClimbing(session) && valueOf(session) > 0);
  const sessionIds = new Set(relevant.map((session) => session.id));
  const climbs = ascents.filter((ascent) => sessionIds.has(ascent.sessionId));

  return buckets.map((bucket) => {
    const inBucket = relevant.filter((session) => {
      const value = valueOf(session);
      return value >= bucket.min && value <= bucket.max;
    });
    const ids = new Set(inBucket.map((session) => session.id));
    const bucketClimbs = climbs.filter((ascent) => ids.has(ascent.sessionId));
    const sends = bucketClimbs.filter((ascent) => ascent.sent).length;
    return {
      label: bucket.label,
      sessions: inBucket.length,
      climbs: bucketClimbs.length,
      sends,
      sendRate: percent(sends, bucketClimbs.length),
    };
  });
}

export function durationBreakdown(sessions: Session[], ascents: Ascent[]): ShapeStats[] {
  return shapeBreakdown(sessions, ascents, DURATION_BUCKETS, (session) => session.durationMin);
}

export function effortBreakdown(sessions: Session[], ascents: Ascent[]): ShapeStats[] {
  return shapeBreakdown(sessions, ascents, EFFORT_BUCKETS, (session) => session.rpe);
}

export interface StyleStats {
  style: Ascent["style"];
  count: number;
  share: number;
}

export function styleBreakdown(ascents: Ascent[]): StyleStats[] {
  const total = ascents.length;
  return (["onsight", "flash", "repeat", "project"] as const).map((style) => {
    const count = ascents.filter((ascent) => ascent.style === style).length;
    return { style, count, share: percent(count, total) };
  });
}

export interface PatternInsight {
  key: string;
  title: string;
  detail: string;
}

export function patternHighlights(
  sessions: Session[],
  ascents: Ascent[],
  limit = 3,
): PatternInsight[] {
  const comparison = environmentComparison(sessions, ascents);
  const { indoor, outdoor } = comparison;
  const insights: PatternInsight[] = [];

  if (
    comparison.sendRateGap !== null &&
    indoor.climbs >= 4 &&
    outdoor.climbs >= 4 &&
    Math.abs(comparison.sendRateGap) >= 10
  ) {
    const indoorStronger = comparison.sendRateGap > 0;
    insights.push({
      key: "send-rate",
      title: indoorStronger ? "Indoors converts better" : "Outdoors converts better",
      detail: `${indoor.sendRate}% of ${indoor.climbs} indoor climbs sent, ${outdoor.sendRate}% of ${outdoor.climbs} outdoor.`,
    });
  }

  if (comparison.hardestGap !== null && Math.abs(comparison.hardestGap) >= 1) {
    insights.push({
      key: "hardest-gap",
      title:
        comparison.hardestGap > 0
          ? "The hardest send is outside"
          : "The hardest send is inside",
      detail: indoor.hardest && outdoor.hardest
        ? `Indoor high point ${formatGrade(indoor.hardest.grade, indoor.hardest.system)}, outdoor high point ${formatGrade(outdoor.hardest.grade, outdoor.hardest.system)}.`
        : "",
    });
  }

  const days = weekdayBreakdown(sessions, ascents);
  const climbDays = days.filter((day) => day.climbs >= 3);
  if (climbDays.length >= 2) {
    const average =
      climbDays.reduce((sum, day) => sum + day.sendRate, 0) / climbDays.length;
    const best = [...climbDays].sort((a, b) => b.sendRate - a.sendRate)[0];
    if (best.sendRate - average >= 10) {
      insights.push({
        key: "weekday",
        title: `${best.day} is your strongest day`,
        detail: `${best.sendRate}% send rate across ${best.climbs} climbs, against ${Math.round(average)}% on other climbing days.`,
      });
    }
  }

  const durations = durationBreakdown(sessions, ascents).filter((bucket) => bucket.climbs >= 3);
  if (durations.length >= 2) {
    const ranked = [...durations].sort((a, b) => b.sendRate - a.sendRate);
    if (ranked[0].sendRate - ranked[ranked.length - 1].sendRate >= 10) {
      insights.push({
        key: "duration",
        title: `${ranked[0].label} converts best`,
        detail: `${ranked[0].sendRate}% send rate there, ${ranked[ranked.length - 1].sendRate}% at ${ranked[ranked.length - 1].label.toLowerCase()}.`,
      });
    }
  }

  const styles = styleBreakdown(ascents);
  const sends = ascents.filter((ascent) => ascent.sent).length;
  const quick = styles
    .filter((style) => style.style === "onsight" || style.style === "flash")
    .reduce((sum, style) => sum + style.count, 0);
  if (sends >= 6 && percent(quick, sends) >= 50) {
    insights.push({
      key: "style",
      title: "You finish attempts early",
      detail: `${percent(quick, sends)}% of your sends went first try, onsight or flash.`,
    });
  }

  return insights.slice(0, limit);
}

