import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, todayISO } from "../../lib/db";
import { formatDate, plural } from "../../lib/format";
import { displayGrade } from "../../lib/grades";
import { hasLegacyData } from "../../lib/legacy";
import { importLegacy } from "../../lib/legacy-import";
import { sessionsByWeek, weekProgress } from "../../lib/levels";
import { environmentComparison, environmentOf, patternHighlights } from "../../lib/patterns";
import { activeProjectLines } from "../../lib/projects";
import { computeTraitScores, focusAreas } from "../../lib/traits";
import { DISCIPLINES, ENVIRONMENTS, type GradeSystem } from "../../lib/types";

const DISCIPLINE_LABEL = Object.fromEntries(
  DISCIPLINES.map((item) => [item.id, item.label]),
) as Record<string, string>;

const ENV_LABEL = Object.fromEntries(
  ENVIRONMENTS.map((item) => [item.id, item.label]),
) as Record<string, string>;

export default function DashboardView() {
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const ascents = useLiveQuery(() => db.ascents.toArray(), []);
  const reflections = useLiveQuery(() => db.reflections.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const profile = useLiveQuery(() => db.profile.get("me"), []);
  const [showLegacy, setShowLegacy] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setShowLegacy(hasLegacyData() && !profile?.legacyImportedAt);
  }, [profile?.legacyImportedAt]);

  const preferred = profile?.gradeSystem ?? "v";
  const week = useMemo(
    () =>
      weekProgress(
        sessions ?? [],
        profile?.weeklyGoal ?? 3,
        profile?.disciplines ?? [],
        todayISO(),
      ),
    [sessions, profile?.weeklyGoal, profile?.disciplines],
  );
  const comparison = useMemo(
    () => environmentComparison(sessions ?? [], ascents ?? []),
    [sessions, ascents],
  );
  const highlights = useMemo(
    () => patternHighlights(sessions ?? [], ascents ?? [], 3),
    [sessions, ascents],
  );
  const activeLines = useMemo(
    () => activeProjectLines(projects ?? [], sessions ?? [], ascents ?? []),
    [projects, sessions, ascents],
  );
  const scores = useMemo(() => computeTraitScores(reflections ?? []), [reflections]);
  const focus = useMemo(() => focusAreas(scores, 3), [scores]);
  const weeks = useMemo(() => sessionsByWeek(sessions ?? [], 8), [sessions]);

  const thisMonth = (sessions ?? []).filter((session) =>
    session.date.startsWith(new Date().toISOString().slice(0, 7)),
  ).length;

  const recent = useMemo(
    () => [...(sessions ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [sessions],
  );

  const ascentsBySession = useMemo(() => {
    const map = new Map<string, typeof ascents>();
    for (const ascent of ascents ?? []) {
      const list = map.get(ascent.sessionId) ?? [];
      list.push(ascent);
      map.set(ascent.sessionId, list);
    }
    return map;
  }, [ascents]);

  const maxWeek = Math.max(1, ...weeks.map((item) => item.count));
  const holds = scores.filter((score) => score.group === "Holds");
  const angles = scores.filter((score) => score.group === "Angles");
  const hasData = (sessions ?? []).length > 0;
  const totalClimbs = ascents?.length ?? 0;
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function hardestFor(
    hardest: { grade: number; system: GradeSystem } | null,
  ): string {
    return hardest ? displayGrade(hardest.grade, hardest.system, preferred) : "None yet";
  }

  async function handleLegacyImport() {
    setImporting(true);
    try {
      await importLegacy();
      window.location.reload();
    } catch {
      setImporting(false);
    }
  }

  return (
    <div className="stack">
      {showLegacy && (
        <section className="banner">
          <div>
            <strong>Old CruxCoach data found on this device</strong>
            <p>
              Bring your previous sessions, grades and reflections across. The old data stays
              where it is.
            </p>
          </div>
          <button className="btn btn-primary btn-small" onClick={handleLegacyImport} disabled={importing}>
            {importing ? "Importing" : "Import old data"}
          </button>
        </section>
      )}

      <header className="masthead">
        <div className="masthead-top">
          <span className="section-label">Logbook</span>
          <span className="masthead-date">{todayLabel}</span>
        </div>
        <div className="masthead-row">
          <div>
            <h1>{profile?.name ? `${profile.name}'s climbing` : "Your climbing"}</h1>
            <p className="lede">
              {profile?.goal || "Indoor and outdoor sessions, counted apart and read together."}
            </p>
          </div>
          <div className="page-actions">
            <a className="btn btn-secondary" href="/app/log?env=indoor">
              Log indoor
            </a>
            <a className="btn btn-primary" href="/app/log?env=outdoor">
              Log outdoor
            </a>
          </div>
        </div>
      </header>

      <section className="env-split" aria-label="Indoor and outdoor totals">
        {(["indoor", "outdoor"] as const).map((environment) => {
          const stats = comparison[environment];
          return (
            <article className={`env-panel ${environment}`} key={environment}>
              <header className="env-panel-head">
                <span className={`env-tag ${environment}`}>{ENV_LABEL[environment]}</span>
                <span className="env-count">{plural(stats.sessions, "session")}</span>
              </header>
              <dl className="env-figures">
                <div>
                  <dt>Sends</dt>
                  <dd>{stats.sends}</dd>
                </div>
                <div>
                  <dt>Send rate</dt>
                  <dd>{stats.climbs ? `${stats.sendRate}%` : "No data"}</dd>
                </div>
                <div>
                  <dt>Hardest</dt>
                  <dd>{hardestFor(stats.hardest)}</dd>
                </div>
              </dl>
              <p className="env-note">
                {stats.climbs
                  ? `${plural(stats.climbs, "climb")} over ${plural(stats.climbingSessions, "climbing session")}.`
                  : `No ${ENV_LABEL[environment].toLowerCase()} climbs logged yet.`}
              </p>
              <a className="text-button" href={`/app/journal?env=${environment}`}>
                Open {ENV_LABEL[environment].toLowerCase()} sessions
              </a>
            </article>
          );
        })}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Lines in progress</h2>
            <p>Named projects still being worked, counted from their attached sessions.</p>
          </div>
          <a href="/app/projects">All projects</a>
        </div>
        {activeLines.length ? (
          <div className="active-lines">
            {(["indoor", "outdoor"] as const).map((environment) => {
              const lines = activeLines.filter(
                (line) => line.project.environment === environment,
              );
              return (
                <div className={`active-lines-group ${environment}`} key={environment}>
                  <div className="active-lines-head">
                    <span className={`env-tag ${environment}`}>{ENV_LABEL[environment]}</span>
                    <span className="muted small">{plural(lines.length, "line")}</span>
                  </div>
                  {lines.length ? (
                    <ul className="active-line-list">
                      {lines.map((line) => (
                        <li key={line.project.id}>
                          <a href={`/app/projects?project=${line.project.id}`}>
                            <span>
                              <strong>{line.project.name}</strong>
                              <small>
                                {DISCIPLINE_LABEL[line.project.discipline]},{" "}
                                {displayGrade(
                                  line.project.grade,
                                  line.project.system,
                                  preferred,
                                )}
                              </small>
                            </span>
                            <span className="active-line-count">
                              {plural(line.stats.attempts, "attempt")},{" "}
                              {plural(line.stats.sends, "send")}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted small">
                      No {ENV_LABEL[environment].toLowerCase()} lines in progress.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No lines in progress</strong>
            <p>Name a project and the sessions you spend on it will collect here.</p>
            <a className="btn btn-secondary" href="/app/projects">
              Open projects
            </a>
          </div>
        )}
      </section>

      <div className="panel-grid wide">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>What the numbers say</h2>
              <p>Patterns drawn from your own logged climbs.</p>
            </div>
            <a href="/app/patterns">All patterns</a>
          </div>
          {highlights.length ? (
            <ol className="insight-list">
              {highlights.map((insight, index) => (
                <li key={insight.key}>
                  <span className="insight-index">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{insight.title}</strong>
                    <p>{insight.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="empty-state">
              <strong>Not enough climbs for a pattern yet</strong>
              <p>
                Log four climbs indoors and four outdoors, then come back to see how the two
                compare.
              </p>
              <a className="btn btn-secondary" href="/app/patterns">
                Open patterns
              </a>
            </div>
          )}
        </section>

        <section className="panel goal-panel">
          <div className="panel-head">
            <h2>This week</h2>
            <span className="badge">{plural(thisMonth, "session")} this month</span>
          </div>
          <strong className="goal-figure">
            {week.count}
            <span> / {week.goal}</span>
          </strong>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${week.percent}%` }} />
          </div>
          <p className="panel-note">
            {week.met
              ? "Weekly goal met. Anything else is a bonus."
              : `${plural(week.remaining, "session")} left to reach your weekly goal.`}
          </p>
          <div className="stat-lines">
            <div>
              <span>Total climbs</span>
              <strong>{totalClimbs}</strong>
            </div>
            <div>
              <span>Focus areas</span>
              <strong>{focus.length ? focus.length : "None"}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="panel-grid even">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Training volume</h2>
              <p>Sessions per week over the last eight weeks.</p>
            </div>
            <span className="badge">
              {plural(weeks.reduce((sum, item) => sum + item.count, 0), "session")}
            </span>
          </div>
          {hasData ? (
            <div className="bar-chart" role="img" aria-label="Sessions per week for the last eight weeks">
              {weeks.map((item) => (
                <div className="bar-column" key={item.label}>
                  <div className="bar-track">
                    <span style={{ height: `${(item.count / maxWeek) * 100}%` }} />
                  </div>
                  <small>{item.label}</small>
                  <em>{item.count}</em>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No sessions yet</strong>
              <p>The weekly volume chart appears after your first session.</p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Focus now</h2>
            <a href="/app/train">Train</a>
          </div>
          {focus.length ? (
            <ul className="focus-list">
              {focus.map((trait) => (
                <li key={trait.key}>
                  <strong>{trait.label}</strong>
                  <span>
                    {trait.score > 0 ? "+" : ""}
                    {trait.score}
                  </span>
                  <small>{plural(trait.samples, "reflection")}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              Rate at least three reflections and your lowest-rated traits will appear here with
              matching workouts.
            </p>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Strengths and struggles</h2>
            <p>Weighted toward your recent reflections.</p>
          </div>
          <a href="/app/reflect">Add reflection</a>
        </div>
        {scores.some((score) => score.samples > 0) ? (
          <div className="trait-columns">
            {[holds, angles].map((group, index) => (
              <div key={index}>
                <h3>{index === 0 ? "Holds" : "Wall angles"}</h3>
                {group.map((trait) => (
                  <div className="trait-row" key={trait.key}>
                    <span className="trait-name">{trait.label}</span>
                    <div className="trait-track" aria-hidden="true">
                      <span
                        className={trait.score >= 0 ? "trait-fill up" : "trait-fill down"}
                        style={{
                          width: `${(Math.abs(trait.score) / 100) * 50}%`,
                          left:
                            trait.score >= 0
                              ? "50%"
                              : `${50 - (Math.abs(trait.score) / 100) * 50}%`,
                        }}
                      />
                    </div>
                    <span className="trait-value">
                      {trait.score > 0 ? "+" : ""}
                      {trait.score}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No reflection data</strong>
            <p>Reflect after a session to map your strengths and struggles.</p>
            <a className="btn btn-secondary" href="/app/reflect">
              Reflect on a session
            </a>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Recent sessions</h2>
            <p>Your latest climbing and training.</p>
          </div>
          <a href="/app/journal">View journal</a>
        </div>
        {recent.length ? (
          <ul className="recent-list">
            {recent.map((session) => (
              <li key={session.id}>
                <span className={`type-dot ${environmentOf(session)}`} aria-hidden="true"></span>
                <div>
                  <strong>{DISCIPLINE_LABEL[session.discipline] ?? session.discipline}</strong>
                  <small>
                    {formatDate(session.date)}
                    {session.durationMin ? `, ${session.durationMin} min` : ""}
                  </small>
                </div>
                <span className="recent-grades">
                  {(ascentsBySession.get(session.id) ?? [])
                    .slice(0, 3)
                    .map((ascent) => displayGrade(ascent.grade, ascent.system, preferred))
                    .join(", ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <strong>Your journal is empty</strong>
            <p>Log a climb or a training session to get started.</p>
            <a className="btn btn-primary" href="/app/log">
              Log a session
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
