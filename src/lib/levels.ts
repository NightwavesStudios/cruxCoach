import { convertGrade, formatGrade, median } from "./grades";
import type { Ascent, Discipline, GradeSystem, Session } from "./types";

export interface Level {
  discipline: Discipline;
  grade: string;
  trend: number;
  samples: number;
}

export function recentSessions(
  sessions: Session[],
  discipline: Discipline,
  count = 5,
): Session[] {
  return sessions
    .filter((session) => session.discipline === discipline)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count);
}

export function levelFor(
  discipline: Discipline,
  sessions: Session[],
  ascents: Ascent[],
  preferred?: GradeSystem,
): Level {
  if (discipline === "training") {
    return { discipline, grade: "—", trend: 0, samples: 0 };
  }

  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const disciplines: Discipline[] =
    discipline === "lead" ? ["lead", "toprope"] : [discipline];
  const eligible = ascents
    .filter((ascent) => {
      const session = sessionMap.get(ascent.sessionId);
      return Boolean(session && disciplines.includes(session.discipline) && ascent.sent);
    })
    .sort((a, b) => {
      const dateA = sessionMap.get(a.sessionId)?.date ?? "";
      const dateB = sessionMap.get(b.sessionId)?.date ?? "";
      return dateB.localeCompare(dateA);
    });

  if (eligible.length === 0) {
    return { discipline, grade: "—", trend: 0, samples: 0 };
  }

  const system = preferred ?? eligible[0].system;
  const recent = eligible
    .slice(0, 10)
    .map((ascent) => convertGrade(ascent.grade, ascent.system, system));
  const previous = eligible
    .slice(10, 20)
    .map((ascent) => convertGrade(ascent.grade, ascent.system, system));
  const currentMedian = median(recent);
  const previousMedian = median(previous);

  return {
    discipline,
    grade: formatGrade(Math.round(currentMedian), system),
    trend:
      previous.length >= 4 && !Number.isNaN(previousMedian)
        ? Math.sign(currentMedian - previousMedian)
        : 0,
    samples: recent.length,
  };
}

export interface WeekProgress {
  count: number;
  goal: number;
  remaining: number;
  percent: number;
  met: boolean;
}

/** Sessions logged this week (Monday to Sunday) against the profile's weekly goal. */
export function weekProgress(
  sessions: Session[],
  goal: number,
  disciplines: Discipline[],
  today: string,
): WeekProgress {
  const start = new Date(`${today}T12:00:00`);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const count = sessions.filter((session) => {
    if (disciplines.length > 0 && !disciplines.includes(session.discipline)) return false;
    const date = new Date(`${session.date}T12:00:00`);
    return date >= start && date < end;
  }).length;

  return {
    count,
    goal,
    remaining: Math.max(0, goal - count),
    percent: goal > 0 ? Math.min(100, Math.round((count / goal) * 100)) : 0,
    met: count >= goal,
  };
}

export function sessionsByWeek(sessions: Session[], weeks = 8): { label: string; count: number }[] {
  const now = new Date();
  const buckets: { label: string; count: number }[] = [];

  for (let offset = weeks - 1; offset >= 0; offset -= 1) {
    const start = new Date(now);
    start.setDate(now.getDate() - offset * 7 - now.getDay() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const count = sessions.filter((session) => {
      const date = new Date(`${session.date}T12:00:00`);
      return date >= start && date < end;
    }).length;

    buckets.push({
      label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    });
  }

  return buckets;
}

export function disciplineSplit(
  sessions: Session[],
): { discipline: Discipline; count: number }[] {
  const counts = new Map<Discipline, number>();
  for (const session of sessions) {
    counts.set(session.discipline, (counts.get(session.discipline) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([discipline, count]) => ({ discipline, count }))
    .sort((a, b) => b.count - a.count);
}
