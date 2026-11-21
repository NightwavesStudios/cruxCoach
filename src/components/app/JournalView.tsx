import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteSession } from "../../lib/db";
import { formatDate, formatMetric } from "../../lib/format";
import { displayGrade, formatGrade } from "../../lib/grades";
import { environmentOf } from "../../lib/patterns";
import {
  DISCIPLINES,
  ENVIRONMENTS,
  type Ascent,
  type Environment,
  type Reflection,
  type Session,
} from "../../lib/types";

type Entry =
  | { kind: "session"; date: string; session: Session; ascents: Ascent[]; environment: Environment }
  | { kind: "reflection"; date: string; reflection: Reflection };

type Filter = "all" | Environment | "training" | "reflections";

const DISCIPLINE_LABEL = Object.fromEntries(
  DISCIPLINES.map((item) => [item.id, item.label]),
) as Record<string, string>;

const ENV_LABEL = Object.fromEntries(
  ENVIRONMENTS.map((item) => [item.id, item.label]),
) as Record<string, string>;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "indoor", label: "Indoor" },
  { value: "outdoor", label: "Outdoor" },
  { value: "training", label: "Training" },
  { value: "reflections", label: "Reflections" },
];

function initialFilter(): Filter {
  if (typeof window === "undefined") return "all";
  const value = new URLSearchParams(window.location.search).get("env");
  return value === "indoor" || value === "outdoor" ? value : "all";
}

export default function JournalView() {
  const sessions = useLiveQuery(() => db.sessions.orderBy("date").reverse().toArray(), []);
  const ascents = useLiveQuery(() => db.ascents.toArray(), []);
  const reflections = useLiveQuery(() => db.reflections.orderBy("date").reverse().toArray(), []);
  const profile = useLiveQuery(() => db.profile.get("me"), []);

  const preferred = profile?.gradeSystem;
  const units = profile?.units ?? "metric";
  const gradeText = (ascent: Ascent) =>
    preferred ? displayGrade(ascent.grade, ascent.system, preferred) : formatGrade(ascent.grade, ascent.system);

  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [search, setSearch] = useState("");

  const entries = useMemo<Entry[]>(() => {
    const bySession = new Map<string, Ascent[]>();
    for (const ascent of ascents ?? []) {
      const list = bySession.get(ascent.sessionId) ?? [];
      list.push(ascent);
      bySession.set(ascent.sessionId, list);
    }

    const sessionEntries: Entry[] = (sessions ?? [])
      .filter((session) => {
        const environment = environmentOf(session);
        if (filter === "indoor" || filter === "outdoor") return environment === filter;
        if (filter === "training") return session.discipline === "training";
        if (filter === "reflections") return false;
        return true;
      })
      .map((session) => ({
        kind: "session" as const,
        date: session.date,
        session,
        environment: environmentOf(session),
        ascents: bySession.get(session.id) ?? [],
      }));

    const reflectionEntries: Entry[] =
      filter === "indoor" || filter === "outdoor" || filter === "training"
        ? []
        : (reflections ?? []).map((reflection) => ({
            kind: "reflection" as const,
            date: reflection.date,
            reflection,
          }));

    return [...sessionEntries, ...reflectionEntries]
      .filter((entry) => {
        if (!search.trim()) return true;
        const haystack =
          entry.kind === "session"
            ? `${entry.session.notes} ${entry.session.location} ${DISCIPLINE_LABEL[entry.session.discipline]} ${ENV_LABEL[entry.environment]} ${entry.ascents
                .map((ascent) => gradeText(ascent))
                .join(" ")}`
            : `${entry.reflection.notes} ${Object.keys(entry.reflection.scores).join(" ")}`;
        return haystack.toLowerCase().includes(search.trim().toLowerCase());
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, ascents, reflections, filter, search, preferred]);

  async function handleDeleteSession(id: string) {
    if (!window.confirm("Delete this session, its climbs and any linked reflection?")) return;
    await deleteSession(id);
  }

  async function handleDeleteReflection(id: string) {
    if (!window.confirm("Delete this reflection?")) return;
    await db.reflections.delete(id);
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter journal">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              className={filter === item.value ? "chip active" : "chip"}
              onClick={() => setFilter(item.value)}
              aria-pressed={filter === item.value}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="field compact search-field">
          <span className="sr-only">Search journal</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes, grades, places"
          />
        </label>
      </div>

      {entries.length === 0 ? (
        <section className="panel empty-state">
          <strong>Nothing here yet</strong>
          <p>
            {search || filter !== "all"
              ? "No entries match this filter. Clear the search or pick another filter."
              : "Log your first session and it will show up here."}
          </p>
          <a className="btn btn-primary" href="/app/log">
            Log a session
          </a>
        </section>
      ) : (
        <ul className="journal-list">
          {entries.map((entry, index) =>
            entry.kind === "session" ? (
              <li className={`journal-entry ${entry.environment}`} key={`${entry.session.id}-${index}`}>
                <div className="journal-entry-head">
                  <div>
                    <div className="entry-tags">
                      <span className={`env-tag ${entry.environment}`}>{ENV_LABEL[entry.environment]}</span>
                      <span className={`type-tag ${entry.session.discipline}`}>
                        {DISCIPLINE_LABEL[entry.session.discipline] ?? entry.session.discipline}
                      </span>
                    </div>
                    <h2>{formatDate(entry.session.date)}</h2>
                  </div>
                  <div className="journal-entry-actions">
                    <a className="text-button" href={`/app/log?session=${entry.session.id}`}>
                      Edit
                    </a>
                    <button
                      className="text-button danger"
                      onClick={() => handleDeleteSession(entry.session.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="journal-meta">
                  {entry.session.durationMin > 0 && <span>{entry.session.durationMin} min</span>}
                  {entry.session.rpe > 0 && <span>Effort {entry.session.rpe}/10</span>}
                  {entry.session.location && <span>{entry.session.location}</span>}
                  {entry.session.distanceKm !== undefined && (
                    <span>{formatMetric("distance", entry.session.distanceKm, units)}</span>
                  )}
                </div>

                {entry.ascents.length > 0 && (
                  <div className="ascent-pills">
                    {entry.ascents.map((ascent) => (
                      <span className={`ascent-pill ${ascent.sent ? "sent" : "open"}`} key={ascent.id}>
                        {gradeText(ascent)}
                        <em>{ascent.style}</em>
                      </span>
                    ))}
                  </div>
                )}

                {entry.session.notes && <p className="journal-notes">{entry.session.notes}</p>}
              </li>
            ) : (
              <li className="journal-entry reflection" key={entry.reflection.id}>
                <div className="journal-entry-head">
                  <div>
                    <div className="entry-tags">
                      <span className="type-tag reflection">Reflection</span>
                    </div>
                    <h2>{formatDate(entry.reflection.date)}</h2>
                  </div>
                  <div className="journal-entry-actions">
                    <a className="text-button" href={`/app/reflect?reflection=${entry.reflection.id}`}>
                      Edit
                    </a>
                    <button
                      className="text-button danger"
                      onClick={() => handleDeleteReflection(entry.reflection.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="ascent-pills">
                  {Object.entries(entry.reflection.scores).map(([key, value]) => (
                    <span className={value > 0 ? "ascent-pill sent" : "ascent-pill open"} key={key}>
                      {key}
                      <em>{value > 0 ? `+${value}` : value}</em>
                    </span>
                  ))}
                </div>
                {entry.reflection.notes && <p className="journal-notes">{entry.reflection.notes}</p>}
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
