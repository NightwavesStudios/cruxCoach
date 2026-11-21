import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, todayISO } from "../../lib/db";
import { formatDate, plural } from "../../lib/format";
import { displayGrade, toCanonical } from "../../lib/grades";
import { hasLegacyData } from "../../lib/legacy";
import { importLegacy } from "../../lib/legacy-import";
import { levelFor, sessionsByWeek, weekProgress } from "../../lib/levels";
import { computeTraitScores, focusAreas } from "../../lib/traits";
import { DISCIPLINES } from "../../lib/types";

const DISCIPLINE_LABEL = Object.fromEntries(
  DISCIPLINES.map((item) => [item.id, item.label]),
) as Record<string, string>;

function trendLabel(trend: number): string {
  if (trend > 0) return "▲ improving";
  if (trend < 0) return "▼ dipping";
  return "→ steady";
}

export default function DashboardView() {
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const ascents = useLiveQuery(() => db.ascents.toArray(), []);
  const reflections = useLiveQuery(() => db.reflections.toArray(), []);
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
  const boulder = useMemo(
    () => levelFor("bouldering", sessions ?? [], ascents ?? [], preferred),
    [sessions, ascents, preferred],
  );
  const rope = useMemo(
    () => levelFor("lead", sessions ?? [], ascents ?? [], preferred),
    [sessions, ascents, preferred],
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

  const progression = useMemo(() => {
    const sessionMap = new Map((sessions ?? []).map((session) => [session.id, session]));
    return [...(ascents ?? [])]
      .filter(
        (ascent) =>
          ascent.sent && sessionMap.get(ascent.sessionId)?.discipline === "bouldering",
      )
      .sort((a, b) => {
        const dateA = sessionMap.get(a.sessionId)?.date ?? "";
        const dateB = sessionMap.get(b.sessionId)?.date ?? "";
        return dateA.localeCompare(dateB);
      })
      .slice(-12);
  }, [sessions, ascents]);

  const progressionPoints = useMemo(() => {
    if (progression.length < 2) return "";
    const values = progression.map((ascent) => toCanonical(ascent.grade, ascent.system));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return values
      .map((value, index) => {
        const x = 12 + (index / (progression.length - 1)) * 276;
        const y = 68 - ((value - min) / span) * 52;
        return `${x},${y}`;
      })
      .join(" ");
  }, [progression]);

  const maxWeek = Math.max(1, ...weeks.map((week) => week.count));
  const holds = scores.filter((score) => score.group === "Holds");
  const angles = scores.filter((score) => score.group === "Angles");
  const hasData = (sessions ?? []).length > 0;

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
              Import your previous sessions, grades and reflections into the new app. Nothing is
              deleted from the old data.
            </p>
          </div>
          <button className="btn btn-primary btn-small" onClick={handleLegacyImport} disabled={importing}>
            {importing ? "Importing…" : "Import old data"}
          </button>
        </section>
      )}

      <header className="page-head">
        <div>
          <p className="page-kicker">Your training</p>
          <h1>{profile?.name ? `Welcome back, ${profile.name}` : "Dashboard"}</h1>
          <p className="page-sub">
            {profile?.goal || "A snapshot of where your climbing is and what to work on next."}
          </p>
        </div>
        <div className="page-actions">
          <a className="btn btn-secondary" href="/app/reflect">
            Reflect
          </a>
          <a className="btn btn-primary" href="/app/log">
            Log a session
          </a>
        </div>
      </header>

      <section className="stat-grid" aria-label="At a glance">
        <article className="stat-card">
          <span className="stat-label">Boulder level</span>
          <strong>{boulder.grade}</strong>
          <small>
            {boulder.samples > 0 ? `${trendLabel(boulder.trend)} · ${plural(boulder.samples, "send")}` : "No sends yet"}
          </small>
        </article>
        <article className="stat-card">
          <span className="stat-label">Rope level</span>
          <strong>{rope.grade}</strong>
          <small>{rope.samples > 0 ? `${trendLabel(rope.trend)} · ${plural(rope.samples, "send")}` : "No sends yet"}</small>
        </article>
        <article className="stat-card">
          <span className="stat-label">This week</span>
          <strong>
            {week.count} / {week.goal}
          </strong>
          <small>
            {week.met
              ? `Goal met · ${thisMonth} this month`
              : `${plural(week.remaining, "session")} to your goal`}
          </small>
        </article>
        <article className="stat-card">
          <span className="stat-label">Focus area</span>
          <strong>{focus[0]?.label ?? "—"}</strong>
          <small>{focus.length ? `${focus.length} areas identified` : "Needs 3 reflections"}</small>
        </article>
      </section>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Training volume</h2>
              <p>Sessions per week over the last eight weeks.</p>
            </div>
            <span className="badge">{plural(weeks.reduce((sum, week) => sum + week.count, 0), "session")}</span>
          </div>
          {hasData ? (
            <div className="bar-chart" role="img" aria-label="Sessions per week for the last eight weeks">
              {weeks.map((week) => (
                <div className="bar-column" key={week.label}>
                  <div className="bar-track">
                    <span style={{ height: `${(week.count / maxWeek) * 100}%` }} />
                  </div>
                  <small>{week.label}</small>
                  <em>{week.count}</em>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <strong>No sessions yet</strong>
              <p>Your weekly volume chart appears after your first session.</p>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Boulder progression</h2>
              <p>Your last {plural(progression.length || 0, "sent boulder")}.</p>
            </div>
          </div>
          {progressionPoints ? (
            <div className="sparkline">
              <svg viewBox="0 0 300 80" role="img" aria-label="Boulder grade progression">
                <polyline points={progressionPoints} fill="none" stroke="currentColor" strokeWidth="2" />
                {progression.map((ascent, index) => {
                  const values = progression.map((item) =>
                    toCanonical(item.grade, item.system),
                  );
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const span = max - min || 1;
                  const value = toCanonical(ascent.grade, ascent.system);
                  const x = 12 + (index / (progression.length - 1)) * 276;
                  const y = 68 - ((value - min) / span) * 52;
                  return <circle key={ascent.id} cx={x} cy={y} r="3" fill="currentColor" />;
                })}
              </svg>
              <div className="sparkline-labels">
                <span>{displayGrade(progression[0].grade, progression[0].system, preferred)}</span>
                <span>
                  {displayGrade(
                    progression[progression.length - 1].grade,
                    progression[progression.length - 1].system,
                    preferred,
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <strong>Not enough sends</strong>
              <p>Log two sent boulders to see your grade trend.</p>
            </div>
          )}
        </section>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Strengths & struggles</h2>
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
                            left: trait.score >= 0 ? "50%" : `${50 - (Math.abs(trait.score) / 100) * 50}%`,
                          }}
                        />
                      </div>
                      <span className="trait-value">{trait.score > 0 ? "+" : ""}{trait.score}</span>
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
            <h2>Focus now</h2>
            <a href="/app/train">Train</a>
          </div>
          {focus.length ? (
            <ul className="focus-list">
              {focus.map((trait) => (
                <li key={trait.key}>
                  <strong>{trait.label}</strong>
                  <span>{trait.score > 0 ? "+" : ""}{trait.score}</span>
                  <small>{plural(trait.samples, "reflection")}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">
              Rate at least three reflections across a few sessions and your lowest-rated traits
              will appear here with matching workouts.
            </p>
          )}
        </section>
      </div>

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
                <span className={`type-dot ${session.discipline}`} aria-hidden="true"></span>
                <div>
                  <strong>{DISCIPLINE_LABEL[session.discipline] ?? session.discipline}</strong>
                  <small>
                    {formatDate(session.date)} · {session.durationMin || "—"} min
                  </small>
                </div>
                <span className="recent-grades">
                  {(ascentsBySession.get(session.id) ?? [])
                    .slice(0, 3)
                    .map((ascent) => displayGrade(ascent.grade, ascent.system, preferred))
                    .join(" · ")}
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
