import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteSession } from "../../lib/db";
import { formatDate } from "../../lib/format";
import { formatGrade } from "../../lib/grades";
import { DISCIPLINES, type Ascent, type Reflection, type Session } from "../../lib/types";

type Entry =
  | { kind: "session"; date: string; session: Session; ascents: Ascent[] }
  | { kind: "reflection"; date: string; reflection: Reflection };

const DISCIPLINE_LABEL = Object.fromEntries(
  DISCIPLINES.map((item) => [item.id, item.label]),
) as Record<string, string>;

export default function JournalView() {
  const sessions = useLiveQuery(() => db.sessions.orderBy("date").reverse().toArray(), []);
  const ascents = useLiveQuery(() => db.ascents.toArray(), []);
  const reflections = useLiveQuery(() => db.reflections.orderBy("date").reverse().toArray(), []);

  const [filter, setFilter] = useState<"all" | "climbing" | "training" | "reflections">("all");
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
        if (filter === "climbing") return session.discipline !== "training";
        if (filter === "training") return session.discipline === "training";
        if (filter === "reflections") return false;
        return true;
      })
      .map((session) => ({
        kind: "session" as const,
        date: session.date,
        session,
        ascents: bySession.get(session.id) ?? [],
      }));

    const reflectionEntries: Entry[] =
      filter === "climbing" || filter === "training"
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
            ? `${entry.session.notes} ${entry.session.location} ${DISCIPLINE_LABEL[entry.session.discipline]} ${entry.ascents
                .map((ascent) => formatGrade(ascent.grade, ascent.system))
                .join(" ")}`
            : `${entry.reflection.notes} ${Object.keys(entry.reflection.scores).join(" ")}`;
        return haystack.toLowerCase().includes(search.trim().toLowerCase());
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, ascents, reflections, filter, search]);

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
          {[
            ["all", "Everything"],
            ["climbing", "Climbing"],
            ["training", "Training"],
            ["reflections", "Reflections"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "chip active" : "chip"}
              onClick={() => setFilter(value as typeof filter)}
              aria-pressed={filter === value}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="field compact search-field">
          <span className="sr-only">Search journal</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes, grades, locations…"
          />
        </label>
      </div>

      {entries.length === 0 ? (
        <section className="panel empty-state">
          <strong>Nothing here yet</strong>
          <p>
            {search || filter !== "all"
              ? "No entries match this filter. Try clearing the search."
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
              <li className="journal-entry" key={`${entry.session.id}-${index}`}>
                <div className="journal-entry-head">
                  <div>
                    <span className={`type-tag ${entry.session.discipline}`}>
                      {DISCIPLINE_LABEL[entry.session.discipline] ?? entry.session.discipline}
                    </span>
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
                  <span>{entry.session.durationMin || "—"} min</span>
                  {entry.session.rpe > 0 && <span>RPE {entry.session.rpe}/10</span>}
                  {entry.session.location && <span>{entry.session.location}</span>}
                </div>

                {entry.ascents.length > 0 && (
                  <div className="ascent-pills">
                    {entry.ascents.map((ascent) => (
                      <span className={`ascent-pill ${ascent.sent ? "sent" : "open"}`} key={ascent.id}>
                        {formatGrade(ascent.grade, ascent.system)}
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
                    <span className="type-tag reflection">Reflection</span>
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
