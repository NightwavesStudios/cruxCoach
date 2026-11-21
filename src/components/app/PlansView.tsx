import { useMemo, useState, type SubmitEvent as FormSubmitEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, todayISO } from "../../lib/db";
import { formatDate } from "../../lib/format";
import { gradeOptions } from "../../lib/grades";
import { makeId } from "../../lib/id";
import { generatePlanSessions, planIntensityLabel } from "../../lib/plans";
import { computeTraitScores, focusAreas } from "../../lib/traits";
import {
  DISCIPLINES,
  DISCIPLINE_SYSTEM,
  type Discipline,
  type PlanSession,
} from "../../lib/types";

const PLAN_DISCIPLINES = DISCIPLINES.filter((item) => item.id !== "training");

export default function PlansView() {
  const plans = useLiveQuery(() => db.plans.orderBy("startDate").reverse().toArray(), []);
  const planSessions = useLiveQuery(() => db.planSessions.toArray(), []);
  const reflections = useLiveQuery(() => db.reflections.toArray(), []);

  const [selected, setSelected] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("plan") ?? undefined;
  });

  const [name, setName] = useState("My training block");
  const [discipline, setDiscipline] = useState<Discipline>("bouldering");
  const [targetGrade, setTargetGrade] = useState(5);
  const [weeks, setWeeks] = useState(4);
  const [days, setDays] = useState(3);
  const [startDate, setStartDate] = useState(todayISO());
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const focus = useMemo(
    () => focusAreas(computeTraitScores(reflections ?? [])),
    [reflections],
  );
  const activePlan = plans?.find((plan) => plan.id === selected);
  const activeSessions = useMemo(
    () =>
      (planSessions ?? [])
        .filter((session) => session.planId === selected)
        .sort((a, b) => a.week - b.week || a.day - b.day),
    [planSessions, selected],
  );

  const gradeChoices = gradeOptions(DISCIPLINE_SYSTEM[discipline]);

  function chooseDiscipline(next: Discipline) {
    setDiscipline(next);
    setTargetGrade(DISCIPLINE_SYSTEM[next] === "v" ? 5 : 13);
  }

  async function createPlan(event: FormSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreating(true);
    try {
      const planId = makeId();
      const target = gradeOptions(DISCIPLINE_SYSTEM[discipline])[targetGrade]?.label ?? "—";
      const generated = generatePlanSessions({
        discipline,
        targetGrade: target,
        weeks,
        daysPerWeek: days,
        startDate,
        focusTraits: focus.map((trait) => trait.key),
      });

      await db.transaction("rw", db.plans, db.planSessions, async () => {
        await db.plans.put({
          id: planId,
          name: name.trim() || "Training block",
          discipline,
          targetGrade: target,
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
    const done = activeSessions.filter((session) => session.status === "done").length;
    const skipped = activeSessions.filter((session) => session.status === "skipped").length;
    const adherence = activeSessions.length
      ? Math.round((done / activeSessions.length) * 100)
      : 0;
    const weekNumbers = [...new Set(activeSessions.map((session) => session.week))];

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
              {activePlan.weeks} weeks · {activePlan.daysPerWeek} days/week · target{" "}
              {activePlan.targetGrade} · starts {formatDate(activePlan.startDate)}
            </p>
          </div>
          <div className="page-actions">
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
                {done} done · {skipped} skipped · {activeSessions.length - done - skipped} planned
              </p>
            </div>
            <span className="badge">{adherence}%</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${adherence}%` }} />
          </div>
        </section>

        <div className="stack">
          {weekNumbers.map((week) => (
            <section className="panel" key={week}>
              <div className="panel-head">
                <h2>Week {week}</h2>
                <span className="badge">
                  {activeSessions.filter((session) => session.week === week && session.status === "done").length}
                  /{activeSessions.filter((session) => session.week === week).length}
                </span>
              </div>
              <div className="plan-sessions">
                {activeSessions
                  .filter((session) => session.week === week)
                  .map((session) => (
                    <article className={`plan-session ${session.status}`} key={session.id}>
                      <div>
                        <span className="plan-day">Day {session.day}</span>
                        <h3>{session.title}</h3>
                        <small>
                          {planIntensityLabel(session.intensity)} · {session.durationMin} min ·{" "}
                          {session.type}
                        </small>
                      </div>
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
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  const activePlans = (plans ?? []).filter((plan) => plan.status === "active");

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Coaching</p>
          <h1>Training plans</h1>
          <p className="page-sub">
            A structured block built from your available days and the traits you want to improve.
          </p>
        </div>
      </header>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Build a plan</h2>
              <p>Weeks 1–3 build, week 4 deloads, then the cycle repeats.</p>
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
                {PLAN_DISCIPLINES.map((item) => (
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

            <div className="form-grid">
              <label className="field">
                <span>Target grade</span>
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
              {creating ? "Building…" : "Generate plan"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Your plans</h2>
            <span className="badge">{activePlans.length} active</span>
          </div>

          {activePlans.length ? (
            <ul className="plan-list">
              {activePlans.map((plan) => {
                const sessions = (planSessions ?? []).filter((session) => session.planId === plan.id);
                const done = sessions.filter((session) => session.status === "done").length;
                return (
                  <li key={plan.id}>
                    <button className="plan-list-item" onClick={() => setSelected(plan.id)}>
                      <div>
                        <strong>{plan.name}</strong>
                        <small>
                          {plan.weeks} weeks · {plan.daysPerWeek} days/week
                        </small>
                      </div>
                      <span>
                        {done}/{sessions.length}
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
