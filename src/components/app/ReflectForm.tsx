import { useEffect, useMemo, useState, type SubmitEvent as FormSubmitEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, saveReflection, todayISO } from "../../lib/db";
import { formatDate } from "../../lib/format";
import { TRAITS, type TraitKey } from "../../lib/types";

const GROUPS = ["Holds", "Angles", "Style"] as const;

const SCALE: Record<number, string> = {
  "-2": "Major struggle",
  "-1": "Minor struggle",
  0: "Neutral",
  1: "Minor strength",
  2: "Major strength",
};

export default function ReflectForm() {
  const [editId] = useState(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("reflection") ?? undefined;
  });

  const existing = useLiveQuery(async () => {
    if (!editId) return null;
    return (await db.reflections.get(editId)) ?? null;
  }, [editId]);

  const sessions = useLiveQuery(
    () => db.sessions.orderBy("date").reverse().limit(20).toArray(),
    [],
  );
  const reflections = useLiveQuery(
    () => db.reflections.orderBy("date").reverse().limit(8).toArray(),
    [],
  );

  const [scores, setScores] = useState<Partial<Record<TraitKey, number>>>({});
  const [sessionId, setSessionId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!editId || hydrated || !existing) return;
    setScores({ ...existing.scores });
    setSessionId(existing.sessionId ?? "");
    setNotes(existing.notes);
    setHydrated(true);
  }, [editId, existing, hydrated]);

  const selectedSession = useMemo(
    () => sessions?.find((session) => session.id === sessionId),
    [sessions, sessionId],
  );

  const rated = Object.values(scores).filter((value) => value !== 0).length;

  function setScore(key: TraitKey, value: number) {
    setScores((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(event: FormSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const clean = Object.fromEntries(
      Object.entries(scores).filter(([, value]) => typeof value === "number" && value !== 0),
    ) as Partial<Record<TraitKey, number>>;

    if (Object.keys(clean).length === 0) {
      setError("Rate at least one trait.");
      return;
    }

    await saveReflection(
      {
        sessionId: sessionId || null,
        date: selectedSession?.date ?? existing?.date ?? todayISO(),
        scores: clean,
        confidence: existing?.confidence ?? 3,
        notes,
      },
      editId,
    );

    if (editId) {
      window.location.assign("/app/journal");
      return;
    }

    setScores({});
    setNotes("");
    setSessionId("");
    setSaved(true);
  }

  async function deleteReflection(id: string) {
    if (!window.confirm("Delete this reflection?")) return;
    await db.reflections.delete(id);
  }

  if (editId && existing === null) {
    return (
      <section className="panel empty-state">
        <strong>Reflection not found</strong>
        <p>It may have been deleted from another tab.</p>
        <a className="btn btn-secondary" href="/app/journal">
          Back to journal
        </a>
      </section>
    );
  }

  return (
    <div className="stack">
      <section className="panel form-panel">
        <form onSubmit={handleSubmit}>
          {editId && (
            <p className="callout">Editing a saved reflection. Saving updates your dashboard scores.</p>
          )}
          <div className="form-grid">
            <label className="field">
              <span>Linked session (optional)</span>
              <select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
                <option value="">Reflect without linking</option>
                {sessions?.map((session) => (
                  <option key={session.id} value={session.id}>
                    {formatDate(session.date)}, {session.discipline}
                  </option>
                ))}
              </select>
            </label>
            <div className="field">
              <span>Rated traits</span>
              <strong>{rated} / {TRAITS.length}</strong>
              <small>Leave anything blank if it did not stand out.</small>
            </div>
          </div>

          <p className="callout">
            -2 major struggle, -1 minor struggle, 0 neutral, +1 minor strength, +2 major strength.
          </p>

          {GROUPS.map((group) => (
            <fieldset className="trait-group" key={group}>
              <legend>{group}</legend>
              {TRAITS.filter((trait) => trait.group === group).map((trait) => {
                const value = scores[trait.key] ?? 0;
                return (
                  <div className="score-row" key={trait.key}>
                    <span className="score-label">{trait.label}</span>
                    <div className="score-options">
                      {[-2, -1, 0, 1, 2].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={value === option ? "score-button active" : "score-button"}
                          aria-pressed={value === option}
                          aria-label={`${trait.label}: ${SCALE[option]}`}
                          title={SCALE[option]}
                          onClick={() => setScore(trait.key, option)}
                        >
                          {option > 0 ? `+${option}` : option}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </fieldset>
          ))}

          <label className="field">
            <span>Notes</span>
            <textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything that stood out in this session."
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          {saved && <p className="form-success">Reflection saved.</p>}

          <div className="form-actions">
            <a className="btn btn-secondary" href={editId ? "/app/journal" : "/app"}>
              {editId ? "Cancel" : "Back to dashboard"}
            </a>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={Boolean(editId && !hydrated)}
            >
              {editId ? (hydrated ? "Save changes" : "Loading") : "Save reflection"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Recent reflections</h2>
            <p>Scores fade with time, so recent reflections count for more.</p>
          </div>
        </div>

        {reflections?.length ? (
          <ul className="reflection-list">
            {reflections.map((reflection) => {
              const entries = Object.entries(reflection.scores) as [TraitKey, number][];
              const strengths = entries.filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
              const struggles = entries.filter(([, value]) => value < 0).sort((a, b) => a[1] - b[1]);
              return (
                <li key={reflection.id} className="reflection-card">
                  <div className="reflection-head">
                    <strong>{formatDate(reflection.date)}</strong>
                    <button className="text-button danger" onClick={() => deleteReflection(reflection.id)}>
                      Delete
                    </button>
                  </div>
                  <p className="reflection-traits">
                    {struggles.length > 0 && (
                      <span className="trait-pill down">
                        Struggles: {struggles.map(([key]) => key).join(", ")}
                      </span>
                    )}
                    {strengths.length > 0 && (
                      <span className="trait-pill up">
                        Strengths: {strengths.map(([key]) => key).join(", ")}
                      </span>
                    )}
                  </p>
                  {reflection.notes && <p className="muted">{reflection.notes}</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">No reflections yet. Your first one will start building your focus areas.</p>
        )}
      </section>
    </div>
  );
}
