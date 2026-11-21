import { useMemo, useState, type SubmitEvent as FormSubmitEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  deleteProject,
  saveProjectRecord,
  setSessionProject,
} from "../../lib/db";
import { formatDate, plural } from "../../lib/format";
import { displayGrade, gradeOptions } from "../../lib/grades";
import {
  createProject,
  projectGradeLabel,
  projectStats,
  projectTotalsForSession,
  setProjectStatus,
  updateProject,
} from "../../lib/projects";
import {
  DISCIPLINES,
  DISCIPLINE_SYSTEM,
  ENVIRONMENTS,
  PROJECT_STATUSES,
  type ClimbingDiscipline,
  type Environment,
  type ProjectStatus,
} from "../../lib/types";

const CLIMBING_DISCIPLINES = DISCIPLINES.filter(
  (item): item is { id: ClimbingDiscipline; label: string } => item.id !== "training",
);

const ENV_LABEL = Object.fromEntries(
  ENVIRONMENTS.map((item) => [item.id, item.label]),
) as Record<string, string>;

const STATUS_LABEL = Object.fromEntries(
  PROJECT_STATUSES.map((item) => [item.id, item.label]),
) as Record<string, string>;

function defaultGrade(discipline: ClimbingDiscipline): number {
  return DISCIPLINE_SYSTEM[discipline] === "v" ? 5 : 13;
}

export default function ProjectsView() {
  const projects = useLiveQuery(() => db.projects.orderBy("updatedAt").reverse().toArray(), []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const ascents = useLiveQuery(() => db.ascents.toArray(), []);
  const profile = useLiveQuery(() => db.profile.get("me"), []);
  const preferred = profile?.gradeSystem ?? "v";

  const [selected, setSelected] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("project") ?? undefined;
  });
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState<ClimbingDiscipline>("bouldering");
  const [environment, setEnvironment] = useState<Environment>("indoor");
  const [grade, setGrade] = useState(5);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editGrade, setEditGrade] = useState(0);

  const project = projects?.find((item) => item.id === selected);
  const system = DISCIPLINE_SYSTEM[discipline];
  const gradeChoices = gradeOptions(system);
  const stats = useMemo(
    () => (project ? projectStats(project, sessions ?? [], ascents ?? []) : null),
    [project, sessions, ascents],
  );

  function openProject(id: string | undefined) {
    setSelected(id);
    setEditing(false);
    window.history.replaceState(null, "", id ? `/app/projects?project=${id}` : "/app/projects");
  }

  function chooseDiscipline(next: ClimbingDiscipline) {
    setDiscipline(next);
    setGrade(defaultGrade(next));
  }

  async function createNewProject(event: FormSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setCreating(true);
    try {
      const created = createProject({
        name,
        discipline,
        environment,
        grade,
        system,
        notes,
      });
      await saveProjectRecord(created);
      setName("");
      setNotes("");
      openProject(created.id);
    } catch {
      setError("Could not save this project. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function startEditing() {
    if (!project) return;
    setEditName(project.name);
    setEditNotes(project.notes);
    setEditGrade(project.grade);
    setEditing(true);
  }

  async function saveEdits(event: FormSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;
    const updated = updateProject(project, {
      name: editName,
      notes: editNotes,
      grade: editGrade,
    });
    await saveProjectRecord(updated);
    setEditing(false);
  }

  async function changeStatus(status: ProjectStatus) {
    if (!project) return;
    await saveProjectRecord(setProjectStatus(project, status));
  }

  async function removeProject() {
    if (!project) return;
    if (!window.confirm("Delete this project? Its sessions stay in your journal.")) return;
    await deleteProject(project.id);
    openProject(undefined);
  }

  if (project && stats) {
    const editChoices = gradeOptions(project.system);

    return (
      <div className="stack">
        <header className="page-head">
          <div>
            <button className="text-button" onClick={() => openProject(undefined)}>
              ← All projects
            </button>
            <h1>{project.name}</h1>
            <p className="page-sub">
              <span className={`env-tag ${project.environment}`}>
                {ENV_LABEL[project.environment]}
              </span>{" "}
              {project.discipline} project, {projectGradeLabel(project)}. {STATUS_LABEL[project.status]}
              , {plural(stats.sessions, "session")} attached.
            </p>
          </div>
          <div className="page-actions">
            <a className="btn btn-primary" href={`/app/log?project=${project.id}`}>
              Log session
            </a>
            <a className="btn btn-secondary" href={`/app/journal?project=${project.id}`}>
              Journal
            </a>
            <button className="btn btn-secondary" onClick={startEditing}>
              Edit details
            </button>
            <button className="btn btn-ghost danger" onClick={removeProject}>
              Delete project
            </button>
          </div>
        </header>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>The tally</h2>
              <p>Read from the sessions attached to this line, never stored twice.</p>
            </div>
            <span className="badge">{projectGradeLabel(project)}</span>
          </div>
          <dl className="project-figures">
            <div>
              <dt>Attempts</dt>
              <dd>{stats.attempts}</dd>
            </div>
            <div>
              <dt>Sends</dt>
              <dd>{stats.sends}</dd>
            </div>
            <div>
              <dt>First try</dt>
              <dd>{stats.firstTrySends}</dd>
            </div>
            <div>
              <dt>Sessions</dt>
              <dd>{stats.sessions}</dd>
            </div>
          </dl>
          <p className="panel-note">
            {stats.firstDate && stats.lastDate
              ? `First session ${formatDate(stats.firstDate)}, latest ${formatDate(stats.lastDate)}, ${plural(stats.spanDays, "day")} end to end.`
              : "No sessions attached yet. Log one and the tally fills in."}
            {stats.bestSend
              ? ` Best send ${displayGrade(stats.bestSend.grade, stats.bestSend.system, preferred)}.`
              : ""}
          </p>
          {project.notes && <p className="project-notes">{project.notes}</p>}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Status</h2>
              <p>Where the line stands. The numbers above stay honest either way.</p>
            </div>
            <span className={`project-status ${project.status}`}>
              {STATUS_LABEL[project.status]}
            </span>
          </div>
          <div className="chips">
            {PROJECT_STATUSES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={project.status === item.id ? "chip active" : "chip"}
                aria-pressed={project.status === item.id}
                onClick={() => changeStatus(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {editing && (
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Edit details</h2>
                <p>The venue stays fixed so indoor and outdoor tallies cannot mix.</p>
              </div>
            </div>
            <form className="stack-sm" onSubmit={saveEdits}>
              <label className="field">
                <span>Project name</span>
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  maxLength={60}
                />
              </label>
              <label className="field">
                <span>Grade ({project.system === "v" ? "V-scale" : "YDS"})</span>
                <select
                  value={editGrade}
                  onChange={(event) => setEditGrade(Number(event.target.value))}
                >
                  {editChoices.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(event) => setEditNotes(event.target.value)}
                  placeholder="Beta, conditions, the move that keeps shutting you down."
                />
              </label>
              <div className="page-actions">
                <button className="btn btn-primary" type="submit">
                  Save changes
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="panel-grid even">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Attempts over time</h2>
                <p>Project grade attempts only, grouped by session date.</p>
              </div>
            </div>
            {stats.timeline.length ? (
              <table className="pattern-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Attempts</th>
                    <th scope="col">Sends</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.timeline.map((point) => (
                    <tr key={point.date}>
                      <th scope="row">{formatDate(point.date)}</th>
                      <td>{point.attempts}</td>
                      <td>{point.sends}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted small">Nothing to plot until a session is attached.</p>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Sessions on this line</h2>
                <p>Detach one and the tally drops back at once.</p>
              </div>
              <span className="badge">{plural(stats.sessions, "session")}</span>
            </div>
            {stats.linkedSessions.length ? (
              <ul className="project-session-list">
                {stats.linkedSessions.map((item) => {
                  const totals = projectTotalsForSession(project, item, ascents ?? []);
                  return (
                    <li key={item.id}>
                      <div>
                        <strong>{formatDate(item.date)}</strong>
                        <small>
                          {item.location || "No place recorded"}, {item.durationMin} min
                        </small>
                      </div>
                      <span>
                        {plural(totals.attempts, "attempt")}, {plural(totals.sends, "send")}
                      </span>
                      <div className="project-session-actions">
                        <a className="text-button" href={`/app/log?session=${item.id}`}>
                          Open
                        </a>
                        <button
                          className="text-button danger"
                          onClick={() => setSessionProject(item.id)}
                        >
                          Detach
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted small">
                No sessions attached. Use Log session and pick this project.
              </p>
            )}
          </section>
        </div>
      </div>
    );
  }

  const groups: { environment: Environment; label: string }[] = [
    { environment: "indoor", label: "Indoor" },
    { environment: "outdoor", label: "Outdoor" },
  ];

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Lines in progress</p>
          <h1>Projects</h1>
          <p className="page-sub">
            A named line, its grade and every session spent on it. Indoor and outdoor projects are
            listed apart and never share a tally.
          </p>
        </div>
        <div className="page-actions">
          <a className="btn btn-secondary" href="/app/log?env=indoor">
            Log indoor
          </a>
          <a className="btn btn-secondary" href="/app/log?env=outdoor">
            Log outdoor
          </a>
        </div>
      </header>

      <div className="panel-grid even">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Start a project</h2>
              <p>A name and a grade is enough. Sessions do the counting.</p>
            </div>
          </div>

          <form className="stack-sm" onSubmit={createNewProject}>
            <label className="field">
              <span>Project name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                placeholder="Jerry's Arete, the cave link"
              />
            </label>

            <fieldset className="field">
              <legend>Discipline</legend>
              <div className="chips">
                {CLIMBING_DISCIPLINES.map((item) => (
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

            <label className="field">
              <span>Grade ({system === "v" ? "V-scale" : "YDS"})</span>
              <select value={grade} onChange={(event) => setGrade(Number(event.target.value))}>
                {gradeChoices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Notes</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Beta, conditions, what to try next."
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={creating}>
              {creating ? "Saving" : "Add project"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Your projects</h2>
              <p>Open a line to see its sessions and tally.</p>
            </div>
            <span className="badge">{plural(projects?.length ?? 0, "project")}</span>
          </div>

          <div className="project-groups">
            {groups.map((group) => {
              const listed = (projects ?? []).filter(
                (item) => item.environment === group.environment,
              );
              return (
                <div className={`project-group ${group.environment}`} key={group.environment}>
                  <div className="project-group-head">
                    <span className={`env-tag ${group.environment}`}>{group.label}</span>
                    <span className="muted small">{plural(listed.length, "project")}</span>
                  </div>
                  {listed.length ? (
                    <ul className="project-list">
                      {listed.map((item) => {
                        const itemStats = projectStats(item, sessions ?? [], ascents ?? []);
                        return (
                          <li key={item.id}>
                            <button className="project-list-item" onClick={() => openProject(item.id)}>
                              <div>
                                <strong>{item.name}</strong>
                                <small>
                                  {item.discipline}, {STATUS_LABEL[item.status]},{" "}
                                  {plural(itemStats.attempts, "attempt")},{" "}
                                  {plural(itemStats.sends, "send")}
                                </small>
                              </div>
                              <span>{displayGrade(item.grade, item.system, preferred)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="muted small">No {group.label.toLowerCase()} projects yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
