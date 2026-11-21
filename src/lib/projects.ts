import { formatGrade, parseGrade, toCanonical } from "./grades";
import { makeId } from "./id";
import { environmentOf } from "./patterns";
import { planEnvironment } from "./plans";
import {
  DISCIPLINE_SYSTEM,
  type Ascent,
  type ClimbingDiscipline,
  type Environment,
  type GradeSystem,
  type Plan,
  type PlanSession,
  type Project,
  type ProjectStatus,
  type Session,
} from "./types";

const DAY_MS = 86_400_000;

export interface ProjectInput {
  name: string;
  discipline: ClimbingDiscipline;
  environment: Environment;
  grade: number;
  system: GradeSystem;
  notes?: string;
}

/** A new project always starts as something the climber is trying. */
export function createProject(
  input: ProjectInput,
  now = new Date().toISOString(),
  id = makeId(),
): Project {
  return {
    id,
    name: input.name.trim() || `${formatGrade(input.grade, input.system)} project`,
    discipline: input.discipline,
    environment: input.environment,
    grade: input.grade,
    system: input.system,
    status: "trying",
    notes: input.notes?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
  };
}

export type ProjectPatch = Partial<
  Pick<Project, "name" | "notes" | "grade" | "status" | "discipline" | "environment" | "system">
>;

export function updateProject(
  project: Project,
  patch: ProjectPatch,
  now = new Date().toISOString(),
): Project {
  const name = patch.name === undefined ? project.name : patch.name.trim() || project.name;
  return {
    ...project,
    ...patch,
    name,
    notes: patch.notes === undefined ? project.notes : patch.notes.trim(),
    updatedAt: now,
  };
}

export function setProjectStatus(
  project: Project,
  status: ProjectStatus,
  now = new Date().toISOString(),
): Project {
  return updateProject(project, { status }, now);
}

export function projectGradeLabel(project: Pick<Project, "grade" | "system">): string {
  return formatGrade(project.grade, project.system);
}

export function projectForSession(
  projects: Project[],
  session: Session,
): Project | undefined {
  if (!session.projectId) return undefined;
  const project = projects.find((item) => item.id === session.projectId);
  if (!project || project.environment !== environmentOf(session)) return undefined;
  return project;
}

/** Sessions counted for a project, with a hard venue boundary. */
export function projectLinkedSessions(
  project: Pick<Project, "id" | "environment">,
  sessions: Session[],
): Session[] {
  return sessions.filter(
    (session) =>
      session.projectId === project.id && environmentOf(session) === project.environment,
  );
}

export function projectTotalsForSession(
  project: Pick<Project, "id" | "environment" | "grade" | "system">,
  session: Session,
  ascents: Ascent[],
): { attempts: number; sends: number } {
  if (
    session.projectId !== project.id ||
    environmentOf(session) !== project.environment
  ) {
    return { attempts: 0, sends: 0 };
  }

  const attempts = ascents.filter(
    (ascent) =>
      ascent.sessionId === session.id &&
      ascent.grade === project.grade &&
      ascent.system === project.system,
  );

  return {
    attempts: attempts.reduce((sum, ascent) => sum + Math.max(1, ascent.attempts), 0),
    sends: attempts.filter((ascent) => ascent.sent).length,
  };
}

export interface ProjectTimelinePoint {
  date: string;
  attempts: number;
  sends: number;
}

export interface ProjectStats {
  sessions: number;
  attempts: number;
  sends: number;
  firstTrySends: number;
  firstDate: string | null;
  lastDate: string | null;
  /** Inclusive days from the first linked session to the last. */
  spanDays: number;
  bestSend: { grade: number; system: GradeSystem } | null;
  timeline: ProjectTimelinePoint[];
  linkedSessions: Session[];
}

/**
 * Counters are derived every time from linked sessions and their ascents. A
 * session at another venue never leaks into a project, even if its id was
 * attached by hand.
 */
export function projectStats(
  project: Project,
  sessions: Session[],
  ascents: Ascent[],
): ProjectStats {
  const linked = projectLinkedSessions(project, sessions);
  const sessionIds = new Set(linked.map((session) => session.id));
  const linkedAscents = ascents.filter((ascent) => sessionIds.has(ascent.sessionId));
  const projectAscents = linkedAscents.filter(
    (ascent) => ascent.grade === project.grade && ascent.system === project.system,
  );
  const projectSends = projectAscents.filter((ascent) => ascent.sent);
  const byDate = new Map<string, ProjectTimelinePoint>();

  for (const session of linked) {
    const totals = projectTotalsForSession(project, session, linkedAscents);
    const point = byDate.get(session.date) ?? { date: session.date, attempts: 0, sends: 0 };
    point.attempts += totals.attempts;
    point.sends += totals.sends;
    byDate.set(session.date, point);
  }

  const dates = linked
    .map((session) => session.date)
    .filter((date) => !Number.isNaN(Date.parse(`${date}T00:00:00Z`)))
    .sort();

  let bestSend: ProjectStats["bestSend"] = null;
  for (const ascent of linkedAscents.filter((item) => item.sent)) {
    const current = bestSend ? toCanonical(bestSend.grade, bestSend.system) : -1;
    if (toCanonical(ascent.grade, ascent.system) > current) {
      bestSend = { grade: ascent.grade, system: ascent.system };
    }
  }

  return {
    sessions: linked.length,
    attempts: projectAscents.reduce(
      (sum, ascent) => sum + Math.max(1, ascent.attempts),
      0,
    ),
    sends: projectSends.length,
    firstTrySends: projectSends.filter(
      (ascent) =>
        ascent.attempts <= 1 || ascent.style === "onsight" || ascent.style === "flash",
    ).length,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
    spanDays:
      dates.length > 0
        ? Math.floor(
            (Date.parse(`${dates[dates.length - 1]}T00:00:00Z`) -
              Date.parse(`${dates[0]}T00:00:00Z`)) /
              DAY_MS,
          ) + 1
        : 0,
    bestSend,
    timeline: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
    linkedSessions: [...linked].sort((a, b) => b.date.localeCompare(a.date)),
  };
}

/**
 * A plan project slot points at the most recently touched live project at the
 * same venue and grade. If none exists, the slot stays a session note.
 */
export function resolveProjectForPlan(
  projects: Project[],
  plan: Plan,
  planSession: PlanSession,
): Project | undefined {
  if (planSession.type !== "project") return undefined;

  const system = plan.targetSystem ?? DISCIPLINE_SYSTEM[plan.discipline];
  const grade = parseGrade(plan.targetGrade, system);
  if (grade === null) return undefined;

  return [...projects]
    .filter(
      (project) =>
        project.environment === planEnvironment(plan) &&
        project.discipline === plan.discipline &&
        project.system === system &&
        project.grade === grade &&
        project.status !== "abandoned",
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
}

export interface ActiveProjectLine {
  project: Project;
  stats: ProjectStats;
}

/** Still-trying projects, newest activity first, for the logbook. */
export function activeProjectLines(
  projects: Project[],
  sessions: Session[],
  ascents: Ascent[],
): ActiveProjectLine[] {
  return projects
    .filter((project) => project.status === "trying")
    .map((project) => ({
      project,
      stats: projectStats(project, sessions, ascents),
    }))
    .sort((a, b) => {
      const byDate = (b.stats.lastDate ?? "").localeCompare(a.stats.lastDate ?? "");
      return byDate || b.project.updatedAt.localeCompare(a.project.updatedAt);
    });
}

export interface ProjectSummary {
  projects: number;
  trying: number;
  sent: number;
  attempts: number;
}

/** Venue-scoped project totals for the patterns screen. */
export function projectSummary(
  projects: Project[],
  sessions: Session[],
  ascents: Ascent[],
  environment: Environment,
): ProjectSummary {
  const matching = projects.filter((project) => project.environment === environment);
  let attempts = 0;
  let sent = 0;

  for (const project of matching) {
    const stats = projectStats(project, sessions, ascents);
    attempts += stats.attempts;
    if (stats.sends > 0 || project.status === "sent") sent += 1;
  }

  return {
    projects: matching.length,
    trying: matching.filter((project) => project.status === "trying").length,
    sent,
    attempts,
  };
}
