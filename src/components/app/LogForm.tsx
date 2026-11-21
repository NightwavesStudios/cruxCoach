import { useEffect, useState, type SubmitEvent as FormSubmitEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, deleteSession, saveSession, todayISO } from "../../lib/db";
import { gradeOptions } from "../../lib/grades";
import { makeId } from "../../lib/id";
import { formatDate, toCanonicalValue, toDisplayValue } from "../../lib/format";
import {
  DISCIPLINES,
  DISCIPLINE_SYSTEM,
  type Ascent,
  type AscentStyle,
  type Discipline,
  type GradeSystem,
  type Session,
} from "../../lib/types";

interface DraftAscent {
  key: string;
  grade: number;
  style: AscentStyle;
  attempts: number;
  sent: boolean;
}

function newAscent(system: GradeSystem): DraftAscent {
  return {
    key: makeId(),
    grade: system === "v" ? 5 : 13,
    style: "flash",
    attempts: 1,
    sent: true,
  };
}

export default function LogForm() {
  const [editId] = useState(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("session") ?? undefined;
  });

  const existing = useLiveQuery<Session | undefined>(
    () => (editId ? db.sessions.get(editId) : undefined),
    [editId],
  );
  const existingAscents = useLiveQuery<Ascent[]>(
    () => (editId ? db.ascents.where("sessionId").equals(editId).toArray() : []),
    [editId],
  );
  const profile = useLiveQuery(() => db.profile.get("me"), []);

  const [date, setDate] = useState(todayISO());
  const [discipline, setDiscipline] = useState<Discipline>("bouldering");
  const [duration, setDuration] = useState(60);
  const [rpe, setRpe] = useState(6);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | undefined>(undefined);
  const [ascents, setAscents] = useState<DraftAscent[]>([newAscent("v")]);
  const [gradeSystem, setGradeSystem] = useState<GradeSystem | undefined>(undefined);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [appliedDefaults, setAppliedDefaults] = useState(false);

  const units = profile?.units ?? "metric";
  const system = gradeSystem ?? profile?.gradeSystem ?? DISCIPLINE_SYSTEM[discipline];

  useEffect(() => {
    if (!editId || hydrated || !existing) return;
    setDate(existing.date);
    setDiscipline(existing.discipline);
    setDuration(existing.durationMin);
    setRpe(existing.rpe || 6);
    setLocation(existing.location);
    setNotes(existing.notes);
    setDistanceKm(existing.distanceKm);
    if (existingAscents && existingAscents.length > 0) {
      setGradeSystem(existingAscents[0].system);
      setAscents(
        existingAscents.map((ascent) => ({
          key: ascent.id,
          grade: ascent.grade,
          style: ascent.style,
          attempts: ascent.attempts,
          sent: ascent.sent,
        })),
      );
    } else {
      setAscents([]);
    }
    setHydrated(true);
  }, [editId, existing, existingAscents, hydrated]);

  useEffect(() => {
    if (editId || appliedDefaults || !profile) return;
    const first = profile.disciplines.find((item) => item !== "training") ?? "bouldering";
    setDiscipline(first);
    setAscents([newAscent(profile.gradeSystem)]);
    setAppliedDefaults(true);
  }, [appliedDefaults, editId, profile]);

  const options = gradeOptions(system);

  function chooseDiscipline(next: Discipline) {
    if (next === discipline) return;
    setDiscipline(next);
    setAscents(next === "training" ? [] : [newAscent(system)]);
  }

  function updateAscent(key: string, patch: Partial<DraftAscent>) {
    setAscents((current) =>
      current.map((ascent) => (ascent.key === key ? { ...ascent, ...patch } : ascent)),
    );
  }

  function removeAscent(key: string) {
    setAscents((current) => current.filter((ascent) => ascent.key !== key));
  }

  async function handleSubmit(event: FormSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!date) {
      setError("Pick a date for this session.");
      return;
    }
    if (discipline !== "training" && ascents.length === 0) {
      setError("Add at least one climb, or log this as a training session.");
      return;
    }

    setSaving(true);
    try {
      await saveSession(
        {
          date,
          discipline,
          durationMin: Number(duration) || 0,
          rpe: Number(rpe) || 0,
          location,
          notes,
          distanceKm: distanceKm && distanceKm > 0 ? distanceKm : undefined,
        },
        discipline === "training"
          ? []
          : ascents.map((ascent) => ({
              grade: ascent.grade,
              system,
              style: ascent.style,
              attempts: Number(ascent.attempts) || 1,
              sent: ascent.sent,
            })),
        editId,
      );
      window.location.assign("/app/journal");
    } catch {
      setError("Could not save this session. Please try again.");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editId) return;
    if (!window.confirm("Delete this session and its climbs? This cannot be undone.")) return;
    await deleteSession(editId);
    window.location.assign("/app/journal");
  }

  return (
    <section className="panel form-panel">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </label>
          <label className="field">
            <span>Duration (minutes)</span>
            <input
              type="number"
              min="0"
              max="600"
              step="5"
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
          </label>
          <label className="field">
            <span>Effort (RPE)</span>
            <input
              type="range"
              min="1"
              max="10"
              value={rpe}
              onChange={(event) => setRpe(Number(event.target.value))}
            />
            <small>{rpe}/10</small>
          </label>
          <label className="field">
            <span>Location</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Gym, crag, board…"
            />
          </label>
          <label className="field">
            <span>Distance ({units === "imperial" ? "mi" : "km"})</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={
                distanceKm === undefined
                  ? ""
                  : toDisplayValue("distance", distanceKm, units)
              }
              onChange={(event) => {
                const raw = event.target.value;
                setDistanceKm(
                  raw ? toCanonicalValue("distance", Number(raw), units) : undefined,
                );
              }}
              placeholder="Approach, optional"
            />
          </label>
        </div>

        <fieldset className="field">
          <legend>Discipline</legend>
          <div className="chips">
            {DISCIPLINES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === discipline ? "chip active" : "chip"}
                aria-pressed={item.id === discipline}
                onClick={() => chooseDiscipline(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        {discipline !== "training" ? (
          <div className="ascent-editor">
            <div className="ascent-head">
              <h3>Climbs</h3>
              <span className="muted">{ascents.length} logged</span>
            </div>

            {ascents.map((ascent, index) => (
              <div className="ascent-row" key={ascent.key}>
                <span className="ascent-index">{index + 1}</span>
                <label className="field compact">
                  <span>Grade</span>
                  <select
                    value={ascent.grade}
                    onChange={(event) => updateAscent(ascent.key, { grade: Number(event.target.value) })}
                  >
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field compact">
                  <span>Style</span>
                  <select
                    value={ascent.style}
                    onChange={(event) => {
                      const style = event.target.value as AscentStyle;
                      updateAscent(ascent.key, {
                        style,
                        sent: style === "project" ? false : true,
                      });
                    }}
                  >
                    <option value="onsight">Onsight</option>
                    <option value="flash">Flash</option>
                    <option value="repeat">Repeat</option>
                    <option value="project">Project</option>
                  </select>
                </label>
                <label className="field compact">
                  <span>Attempts</span>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={ascent.attempts}
                    onChange={(event) => updateAscent(ascent.key, { attempts: Number(event.target.value) })}
                  />
                </label>
                <label className="check">
                  <input
                    type="checkbox"
                    checked={ascent.sent}
                    onChange={(event) => updateAscent(ascent.key, { sent: event.target.checked })}
                  />
                  Sent
                </label>
                {ascents.length > 1 && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove climb ${index + 1}`}
                    onClick={() => removeAscent(ascent.key)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => setAscents((current) => [...current, newAscent(system)])}
            >
              + Add climb
            </button>
          </div>
        ) : (
          <p className="callout">
            Training sessions are stored in your journal and count toward your weekly volume.
          </p>
        )}

        <label className="field">
          <span>Notes</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={
              discipline === "training"
                ? "What did you train?"
                : "What worked, what felt hard, anything worth remembering."
            }
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          {editId && (
            <button type="button" className="btn btn-ghost danger" onClick={handleDelete}>
              Delete
            </button>
          )}
          <a className="btn btn-secondary" href="/app/journal">
            Cancel
          </a>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : editId ? "Save changes" : "Save session"}
          </button>
        </div>
        {editId && existing && <p className="muted small">Editing {formatDate(existing.date)}</p>}
      </form>
    </section>
  );
}
