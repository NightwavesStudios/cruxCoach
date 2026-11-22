import { useEffect, useRef, useState, type SubmitEvent as FormSubmitEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { importAll, exportAll, db, defaultProfile, clearAll, getProfile } from "../../lib/db";
import { formatMetric, toCanonicalValue, toDisplayValue } from "../../lib/format";
import { hasLegacyData } from "../../lib/legacy";
import { importLegacy } from "../../lib/legacy-import";
import { backupReminder, requestPersistentStorage } from "../../lib/storage";
import { DISCIPLINES, type Discipline, type Profile } from "../../lib/types";

export default function ProfileView() {
  const profile = useLiveQuery(() => db.profile.get("me"), []);
  const sessionCount = useLiveQuery(() => db.sessions.count(), []);
  const reflectionCount = useLiveQuery(() => db.reflections.count(), []);
  const planCount = useLiveQuery(() => db.plans.count(), []);
  const fileInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Profile>(defaultProfile());
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [legacyAvailable, setLegacyAvailable] = useState(false);
  const [persistent, setPersistent] = useState<boolean | null>(null);

  useEffect(() => {
    setLegacyAvailable(hasLegacyData() && !profile?.legacyImportedAt);
  }, [profile?.legacyImportedAt]);

  useEffect(() => {
    let active = true;
    void requestPersistentStorage().then((granted) => {
      if (active) setPersistent(granted);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (profile && !loaded) {
      setForm(profile);
      setLoaded(true);
    }
  }, [profile, loaded]);

  const reminder = backupReminder({
    hasData: (sessionCount ?? 0) + (reflectionCount ?? 0) + (planCount ?? 0) > 0,
    lastBackupAt: profile?.lastBackupAt,
  });

  function patch(patchValue: Partial<Profile>) {
    setForm((current) => ({ ...current, ...patchValue }));
    setSaved(false);
  }

  function toggleDiscipline(discipline: Discipline) {
    const next = form.disciplines.includes(discipline)
      ? form.disciplines.filter((item) => item !== discipline)
      : [...form.disciplines, discipline];
    patch({ disciplines: next });
  }

  async function saveProfile(event: FormSubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    await db.profile.put({ ...form, id: "me" });
    setSaved(true);
    setMessage("");
  }

  async function handleExport() {
    const text = await exportAll();
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cruxcoach-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    const existing = await getProfile();
    await db.profile.put({ ...existing, lastBackupAt: new Date().toISOString() });
    setMessage("Backup downloaded.");
  }

  async function handleImport(file: File) {
    setError("");
    setMessage("");
    if (!window.confirm("This replaces all data in this browser with the backup. Continue?")) return;
    try {
      const count = await importAll(await file.text());
      setMessage(`Imported ${count} records. Reloading.`);
      window.location.reload();
    } catch {
      setError("That file is not a valid CruxCoach backup.");
    }
  }

  async function handleLegacyImport() {
    const result = await importLegacy();
    if (result.status === "no-data") {
      setError("No old data found on this device.");
      return;
    }
    setLegacyAvailable(false);
    if (result.status === "already-imported") {
      setMessage("Old data was already imported once. Nothing was added.");
      return;
    }
    setMessage(
      `Imported ${result.report.sessions} sessions, ${result.report.ascents} climbs and ${result.report.reflections} reflections.`,
    );
  }

  async function handleClear() {
    if (!window.confirm("Delete every session, reflection, plan and setting in this browser?")) return;
    await clearAll();
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Settings</p>
          <h1>Profile</h1>
          <p className="page-sub">Preferences and the data stored locally on this device.</p>
        </div>
        <span className="badge">{sessionCount ?? 0} sessions</span>
      </header>

      <div className="panel-grid">
        <section className="panel form-panel">
          <form onSubmit={saveProfile} className="stack-sm">
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => patch({ name: event.target.value })}
                placeholder="What should we call you?"
                maxLength={50}
              />
            </label>
            <label className="field">
              <span>Email (optional)</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => patch({ email: event.target.value })}
                placeholder="For your own reference only"
              />
            </label>
            <label className="field">
              <span>Main goal</span>
              <input
                value={form.goal}
                onChange={(event) => patch({ goal: event.target.value })}
                placeholder="First V5, a 5.12a project, more endurance"
                maxLength={120}
              />
            </label>

            <fieldset className="field">
              <legend>Disciplines</legend>
              <div className="chips">
                {DISCIPLINES.filter((item) => item.id !== "training").map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={form.disciplines.includes(item.id) ? "chip active" : "chip"}
                    aria-pressed={form.disciplines.includes(item.id)}
                    onClick={() => toggleDiscipline(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="form-grid">
              <label className="field">
                <span>Grade system</span>
                <select
                  value={form.gradeSystem}
                  onChange={(event) => patch({ gradeSystem: event.target.value as Profile["gradeSystem"] })}
                >
                  <option value="v">V-scale</option>
                  <option value="yds">YDS</option>
                </select>
              </label>
              <label className="field">
                <span>Units</span>
                <select
                  value={form.units}
                  onChange={(event) => patch({ units: event.target.value as Profile["units"] })}
                >
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </label>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Sessions per week</span>
                <select
                  value={form.weeklyGoal}
                  onChange={(event) => patch({ weeklyGoal: Number(event.target.value) })}
                >
                  {[2, 3, 4, 5, 6, 7].map((value) => (
                    <option key={value} value={value}>
                      {value} sessions
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Height ({form.units === "imperial" ? "in" : "cm"})</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={
                    form.heightCm === undefined
                      ? ""
                      : toDisplayValue("height", form.heightCm, form.units)
                  }
                  onChange={(event) => {
                    const raw = event.target.value;
                    patch({
                      heightCm: raw
                        ? toCanonicalValue("height", Number(raw), form.units)
                        : undefined,
                    });
                  }}
                  placeholder="Optional"
                />
              </label>
              <label className="field">
                <span>Weight ({form.units === "imperial" ? "lb" : "kg"})</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={
                    form.weightKg === undefined
                      ? ""
                      : toDisplayValue("weight", form.weightKg, form.units)
                  }
                  onChange={(event) => {
                    const raw = event.target.value;
                    patch({
                      weightKg: raw
                        ? toCanonicalValue("weight", Number(raw), form.units)
                        : undefined,
                    });
                  }}
                  placeholder="Optional"
                />
              </label>
            </div>

            {(form.heightCm !== undefined || form.weightKg !== undefined) && (
              <p className="muted small">
                Entered as{" "}
                {[
                  form.heightCm !== undefined
                    ? formatMetric("height", form.heightCm, form.units)
                    : null,
                  form.weightKg !== undefined
                    ? formatMetric("weight", form.weightKg, form.units)
                    : null,
                ]
                  .filter(Boolean)
                  .join(", ")}
                .
              </p>
            )}

            {saved && <p className="form-success">Profile saved.</p>}
            <button className="btn btn-primary" type="submit">
              Save profile
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Your data</h2>
              <p>Everything stays in this browser unless you export it.</p>
            </div>
          </div>

          <ul className="data-stats">
            <li><strong>{sessionCount ?? 0}</strong><span>Sessions</span></li>
            <li><strong>{reflectionCount ?? 0}</strong><span>Reflections</span></li>
            <li><strong>{planCount ?? 0}</strong><span>Plans</span></li>
          </ul>

          {legacyAvailable && (
            <div className="banner inline">
              <div>
                <strong>Old CruxCoach data available</strong>
                <p>Bring your previous sessions and reflections across.</p>
              </div>
              <button className="btn btn-secondary btn-small" onClick={handleLegacyImport}>
                Import
              </button>
            </div>
          )}

          {reminder && (
            <div className="banner inline">
              <div>
                <strong>Backup reminder</strong>
                <p>{reminder}</p>
              </div>
            </div>
          )}

          <div className="data-actions">
            <button className="btn btn-secondary" onClick={handleExport}>
              Download backup
            </button>
            <button className="btn btn-secondary" onClick={() => fileInput.current?.click()}>
              Restore backup
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
                event.target.value = "";
              }}
            />
          </div>

          {persistent === true && (
            <p className="muted small">
              This browser has marked the logbook as persistent, so it is less likely to clear it
              when space runs short. A downloaded backup is still the only copy you control.
            </p>
          )}
          {persistent === false && (
            <p className="muted small">
              This browser may clear your logbook when space runs short. Keep a backup file
              somewhere else.
            </p>
          )}

          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}

          <p className="muted small">
            There are no accounts and no syncing. Everything is stored in this browser.
          </p>

          <button className="text-button danger clear-data" onClick={handleClear}>
            Delete all data
          </button>
        </section>
      </div>
    </div>
  );
}
