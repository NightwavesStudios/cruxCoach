import { useEffect, useMemo, useState, type SubmitEvent as FormSubmitEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, defaultProfile, todayISO } from "../../lib/db";
import { formatDate } from "../../lib/format";
import { gradeOptions } from "../../lib/grades";
import { makeId } from "../../lib/id";
import {
  generatePlanSessions,
  planDefaults,
  planEnvironment,
  planIntensityLabel,
  planProgress,
} from "../../lib/plans";
import { resolveProjectForPlan } from "../../lib/projects";
import { computeTraitScores, focusAreas } from "../../lib/traits";
import {
  DISCIPLINES,
  ENVIRONMENTS,
  type Discipline,
  type Environment,
  type Plan,
  type PlanSession,
} from "../../lib/types";

const PLAN_DISCIPLINES = DISCIPLINES.filter((item) => item.id !== "training");

const ENV_LABEL = Object.fromEntries(
  ENVIRONMENTS.map((item) => [item.id, item.label]),
) as Record<string, string>;

export default function PlansView() {
  const plans = useLiveQuery(() => db.plans.orderBy("startDate").reverse().toArray(), []);
  const planSessions = useLiveQuery(() => db.planSessions.toArray(), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);
  const reflections = useLiveQuery(() => db.reflections.toArray(), []);
  const profile = useLiveQuery(() => db.profile.get("me"), []);
  const prefs = profile ?? defaultProfile();
  const allowedDisciplines = prefs.disciplines.length
    ? PLAN_DISCIPLINES.filter((item) => prefs.disciplines.includes(item.id))
    : PLAN_DISCIPLINES;

  const [selected, setSelected] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("plan") ?? undefined;
  });

  const [name, setName] = useState("My training block");
  const [discipline, setDiscipline] = useState<Discipline>("bouldering");
  const [environment, setEnvironment] = useState<Environment>("indoor");
  const [targetGrade, setTargetGrade] = useState(5);
  const [weeks, setWeeks] = useState(4);
  const [days, setDays] = useState(3);
  const [startDate, setStartDate] = useState(todayISO());
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [appliedDefaults, setAppliedDefaults] = useState(false);

  useEffect(() => {
    if (!profile || appliedDefaults) return;
    const defaults = planDefaults(profile);
    setDiscipline(defaults.discipline);
    setDays(defaults.daysPerWeek);
    setTargetGrade(defaults.targetGrade);
    setAppliedDefaults(true);
  }, [appliedDefaults, profile]);

  const focus = useMemo(
    () => focusAreas(computeTraitScores(reflections ?? [])),
    [reflections],
  );
  const today = todayISO();
  const activePlan = plans?.find((plan) => plan.id === selected);
  const activeSessions = useMemo(
    () =>
      (planSessions ?? [])
        .filter((session) => session.planId === selected)
        .sort((a, b) => a.week - b.week || a.day - b.day),
    [planSessions, selected],
  );

  const gradeChoices = gradeOptions(prefs.gradeSystem);

  function chooseDiscipline(next: Discipline) {
    setDiscipline(next);
    setTargetGrade(prefs.gradeSystem === "v" ? 5 : 13);
  }

  async function createPlan(event: FormSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreating(true);
    try {
      const planId = makeId();
      const target = gradeOptions(prefs.gradeSystem)[targetGrade]?.label ?? "Unset";
      const generated = generatePlanSessions({
        discipline,
        environment,
        targetGrade: target,
        weeks,
        daysPerWeek: days,
        focusTraits: focus.map((trait) => trait.key),
      });

      await db.transaction("rw", db.plans, db.planSessions, async () => {
        await db.plans.put({
          id: planId,
          name: name.trim() || "Training block",
          discipline,
          environment,
          targetGrade: target,
          targetSystem: prefs.gradeSystem,
          weeks,
          daysPerWeek: days,
          startDate,
          status: "active",
          createdAt: new Date().toISOString(),
        });
        await db.planSessions.bulkPut(
          generated.map((session) => ({
            ...session,
            id: makeId(),
            planId,
            status: "planned" as const,
          })),
        );
      });

      setSelected(planId);
      window.history.replaceState(null, "", `/app/plans?plan=${planId}`);
    } catch {
      setError("Could not create the plan. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: PlanSession["status"]) {
    await db.planSessions.update(id, { status });
  }

  async function setPlanStatus(id: string, status: Plan["status"]) {
    await db.plans.update(id, { status });
  }

  async function deletePlan(id: string) {
    if (!window.confirm("Delete this plan and its schedule? Logged sessions are kept.")) return;
    await db.transaction("rw", db.plans, db.planSessions, async () => {
      await db.plans.delete(id);
      await db.planSessions.where("planId").equals(id).delete();
    });
    setSelected(undefined);
    window.history.replaceState(null, "", "/app/plans");
  }

  if (activePlan) {
    const progress = planProgress(activePlan, planSessions ?? [], today);
    const completed = activePlan.status === "completed";
    const weekNumbers = [...new Set(activeSessions.map((session) => session.week))];
    const currentWeek = completed ? 0 : progress.week;
    const weekLabel = completed
      ? "Block complete"
      : progress.week === 0
        ? `Starts ${formatDate(activePlan.startDate)}`
        : progress.ended
          ? "Final week passed"
          : `Week ${progress.week} of ${activePlan.weeks}`;

    return (
      <div className="stack">
        <header className="page-head">
          <div>
            <button
              className="text-button"
              onClick={() => {
                setSelected(undefined);
                window.history.replaceState(null, "", "/app/plans");
              }}
            >
              ← All plans
            </button>
            <h1>{activePlan.name}</h1>
            <p className="page-sub">
              <span className={`env-tag ${planEnvironment(activePlan)}`}>
                {ENV_LABEL[planEnvironment(activePlan)]} plan
              </span>{" "}
              {activePlan.weeks} weeks, {activePlan.daysPerWeek} days a week, target{" "}
              {activePlan.targetGrade}, starting {formatDate(activePlan.startDate)}
            </p>
          </div>
          <div className="page-actions">
            {completed ? (
              <button
                className="btn btn-secondary"
                onClick={() => setPlanStatus(activePlan.id, "active")}
              >
                Reopen plan
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={() => setPlanStatus(activePlan.id, "completed")}
              >
                Complete plan
              </button>
            )}
            <button className="btn btn-ghost danger" onClick={() => deletePlan(activePlan.id)}>
              Delete plan
            </button>
          </div>
        </header>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Adherence</h2>
              <p>
                {weekLabel}. {progress.done} done, {progress.skipped} skipped
                {!completed && `, ${progress.remaining} planned`}
              </p>
            </div>
            <span className="badge">{completed ? "Completed" : `${progress.adherence}%`}</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress.adherence}%` }} />
          </div>
          {!completed && progress.remaining === 0 && (
            <p className="callout">
              Every session is done or skipped. Complete the plan to close the block.
            </p>
          )}
        </section>

        <div className="stack">
          {weekNumbers.map((week) => (
            <section className="panel" key={week}>
              <div className="panel-head">
                <div>
                  <h2>Week {week}</h2>
                  {week === currentWeek && <p>Current week</p>}
                </div>
                <span className="badge">
                  {
                    activeSessions.filter(
                      (session) => session.week === week && (session.status === "done" || session.sessionId),
                    ).length
                  }
                  /{activeSessions.filter((session) => session.week === week).length}
                </span>
              </div>
              <div className="plan-sessions">
                {activeSessions
                  .filter((session) => session.week === week)
                  .map((session) => {
                    const planProject = resolveProjectForPlan(projects ?? [], activePlan, session);
                    return (
                    <article className={`plan-session ${session.status}`} key={session.id}>
                      <div>
                        <span className="plan-day">Day {session.day}</span>
                        <h3>{session.title}</h3>
                        <small>
                          {planIntensityLabel(session.intensity)}, {session.durationMin} min,{" "}
                          {session.type}
                        </small>
                        {session.type === "project" && !planProject && (
                          <small>No project record yet</small>
                        )}
                      </div>
                      <div className="plan-session-actions">
                        {planProject && (
                          <a
                            className="text-button"
                            href={`/app/projects?project=${planProject.id}`}
                          >
                            Open {planProject.name}
                          </a>
                        )}
                        {session.sessionId ? (
                          <a className="text-button" href={`/app/log?session=${session.sessionId}`}>
                            View log
                          </a>
                        ) : session.status !== "done" ? (
                          <a className="text-button" href={`/app/log?planSession=${session.id}`}>
                            Log this
                          </a>
                        ) : (
                          <span className="muted small">Marked done</span>
                        )}
                        <select
                          aria-label={`Status for ${session.title}`}
                          value={session.status}
                          onChange={(event) =>
                            updateStatus(session.id, event.target.value as PlanSession["status"])
                          }
                        >
                          <option value="planned">Planned</option>
                          <option value="done">Done</option>
                          <option value="skipped">Skipped</option>
                        </select>
                      </div>
                    </article>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  const activePlans = (plans ?? []).filter((plan) => plan.status === "active");
  const listedPlans = [...activePlans, ...(plans ?? []).filter((plan) => plan.status === "completed")];

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Planning</p>
          <h1>Training plans</h1>
          <p className="page-sub">
            A venue, the days you can climb and the traits your reflections point at. Log a
            planned session and the block records it against the week.
          </p>
        </div>
      </header>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Build a plan</h2>
              <p>Weeks 1 to 3 build, week 4 deloads, then the cycle repeats.</p>
            </div>
          </div>

          <form onSubmit={createPlan} className="stack-sm">
            <label className="field">
              <span>Plan name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} />
            </label>

            <fieldset className="field">
              <legend>Discipline</legend>
              <div className="chips">
                {allowedDisciplines.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={discipline === item.id ? "chip active" : "chip"}
                    aria-pressed={discipline === item.id}
                    onClick={() => chooseDiscipline(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>Where</legend>
              <div className="chips">
                {ENVIRONMENTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={environment === item.id ? "chip active" : "chip"}
                    aria-pressed={environment === item.id}
                    onClick={() => setEnvironment(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="form-grid">
              <label className="field">
                <span>Target grade ({prefs.gradeSystem === "v" ? "V-scale" : "YDS"})</span>
                <select value={targetGrade} onChange={(event) => setTargetGrade(Number(event.target.value))}>
                  {gradeChoices.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Weeks</span>
                <select value={weeks} onChange={(event) => setWeeks(Number(event.target.value))}>
                  {[2, 3, 4, 5, 6, 7, 8].map((value) => (
                    <option key={value} value={value}>
                      {value} weeks
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Days per week</span>
                <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
                  {[2, 3, 4, 5, 6].map((value) => (
                    <option key={value} value={value}>
                      {value} days
                    </option>
                  ))}
                </select>
                <small>Defaults to your {prefs.weeklyGoal}-session weekly goal</small>
              </label>
              <label className="field">
                <span>Start date</span>
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
            </div>

            <p className="callout">
              {focus.length
                ? `Focus built in: ${focus.map((trait) => trait.label).join(", ")}.`
                : "Reflect on three sessions to personalise the focus. The plan still works without it."}
            </p>

            {error && <p className="form-error">{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? "Building" : "Generate plan"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Your plans</h2>
            <span className="badge">{activePlans.length} active</span>
          </div>

          {listedPlans.length ? (
            <ul className="plan-list">
              {listedPlans.map((plan) => {
                const progress = planProgress(plan, planSessions ?? [], today);
                return (
                  <li key={plan.id}>
                    <button className="plan-list-item" onClick={() => setSelected(plan.id)}>
                      <div>
                        <strong>{plan.name}</strong>
                        <small>
                          {ENV_LABEL[planEnvironment(plan)]}, {plan.weeks} weeks,{" "}
                          {plan.daysPerWeek} days a week,{" "}
                          {plan.status === "completed"
                            ? `completed, ${progress.adherence}%`
                            : progress.week === 0
                              ? "not started"
                              : `week ${progress.week} of ${plan.weeks}`}
                        </small>
                      </div>
                      <span>
                        {progress.done}/{progress.total}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted">No plans yet. Build one to get a weekly schedule.</p>
          )}
        </section>
      </div>
    </div>
  );
}
