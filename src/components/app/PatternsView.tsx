import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { formatMetric, plural } from "../../lib/format";
import { displayGrade } from "../../lib/grades";
import {
  durationBreakdown,
  effortBreakdown,
  environmentComparison,
  environmentOf,
  gradeBreakdown,
  patternHighlights,
  styleBreakdown,
  weekdayBreakdown,
  type GradeBand,
} from "../../lib/patterns";
import type { GradeSystem } from "../../lib/types";

function hardestLabel(
  hardest: { grade: number; system: GradeSystem } | null,
  preferred: GradeSystem,
): string {
  return hardest ? displayGrade(hardest.grade, hardest.system, preferred) : "None yet";
}

function GradeTable({ bands, preferred }: { bands: GradeBand[]; preferred: GradeSystem }) {
  if (bands.length === 0) {
    return <p className="muted small">No climbs logged in this discipline yet.</p>;
  }

  return (
    <table className="pattern-table">
      <thead>
        <tr>
          <th scope="col">Grade</th>
          <th scope="col">Climbs</th>
          <th scope="col">Sends</th>
          <th scope="col">Send rate</th>
        </tr>
      </thead>
      <tbody>
        {bands.map((band) => (
          <tr key={`${band.system}-${band.grade}`}>
            <th scope="row">{displayGrade(band.grade, band.system, preferred)}</th>
            <td>{band.climbs}</td>
            <td>{band.sends}</td>
            <td>
              <div className="rate-cell">
                <span className="rate-bar" aria-hidden="true">
                  <span style={{ width: `${band.rate}%` }} />
                </span>
                <em>{band.rate}%</em>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PatternsView() {
  const sessions = useLiveQuery(() => db.sessions.toArray(), []);
  const ascents = useLiveQuery(() => db.ascents.toArray(), []);
  const profile = useLiveQuery(() => db.profile.get("me"), []);
  const preferred = profile?.gradeSystem ?? "v";
  const units = profile?.units ?? "metric";

  const comparison = useMemo(
    () => environmentComparison(sessions ?? [], ascents ?? []),
    [sessions, ascents],
  );
  const highlights = useMemo(
    () => patternHighlights(sessions ?? [], ascents ?? [], 4),
    [sessions, ascents],
  );
  const boulder = useMemo(
    () => gradeBreakdown(sessions ?? [], ascents ?? [], ["bouldering"]),
    [sessions, ascents],
  );
  const rope = useMemo(
    () => gradeBreakdown(sessions ?? [], ascents ?? [], ["toprope", "lead"]),
    [sessions, ascents],
  );
  const days = useMemo(() => weekdayBreakdown(sessions ?? [], ascents ?? []), [sessions, ascents]);
  const durations = useMemo(
    () => durationBreakdown(sessions ?? [], ascents ?? []),
    [sessions, ascents],
  );
  const efforts = useMemo(
    () => effortBreakdown(sessions ?? [], ascents ?? []),
    [sessions, ascents],
  );
  const styles = useMemo(() => styleBreakdown(ascents ?? []), [ascents]);

  const totalClimbs = ascents?.length ?? 0;
  const bothEnvironments = comparison.indoor.climbs > 0 && comparison.outdoor.climbs > 0;

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Reading the log</p>
          <h1>Patterns</h1>
          <p className="page-sub">
            Indoor and outdoor climbing are counted separately. The comparison shows what travels
            between them, what does not, and when your sessions actually convert.
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

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Indoor against outdoor</h2>
            <p>Same climber, two different problems. Rates only count logged climbs.</p>
          </div>
        </div>

        <table className="pattern-table comparison-table">
          <thead>
            <tr>
              <th scope="col">Measure</th>
              <th scope="col">Indoor</th>
              <th scope="col">Outdoor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Sessions</th>
              <td>{comparison.indoor.sessions}</td>
              <td>{comparison.outdoor.sessions}</td>
            </tr>
            <tr>
              <th scope="row">Climbs</th>
              <td>{comparison.indoor.climbs}</td>
              <td>{comparison.outdoor.climbs}</td>
            </tr>
            <tr>
              <th scope="row">Sends</th>
              <td>{comparison.indoor.sends}</td>
              <td>{comparison.outdoor.sends}</td>
            </tr>
            <tr>
              <th scope="row">Send rate</th>
              <td>
                <div className="rate-cell">
                  <span className="rate-bar indoor" aria-hidden="true">
                    <span style={{ width: `${comparison.indoor.sendRate}%` }} />
                  </span>
                  <em>{comparison.indoor.climbs ? `${comparison.indoor.sendRate}%` : "No data"}</em>
                </div>
              </td>
              <td>
                <div className="rate-cell">
                  <span className="rate-bar outdoor" aria-hidden="true">
                    <span style={{ width: `${comparison.outdoor.sendRate}%` }} />
                  </span>
                  <em>{comparison.outdoor.climbs ? `${comparison.outdoor.sendRate}%` : "No data"}</em>
                </div>
              </td>
            </tr>
            <tr>
              <th scope="row">Onsight or flash share</th>
              <td>{comparison.indoor.sends ? `${comparison.indoor.flashRate}%` : "No data"}</td>
              <td>{comparison.outdoor.sends ? `${comparison.outdoor.flashRate}%` : "No data"}</td>
            </tr>
            <tr>
              <th scope="row">Hardest send</th>
              <td>{hardestLabel(comparison.indoor.hardest, preferred)}</td>
              <td>{hardestLabel(comparison.outdoor.hardest, preferred)}</td>
            </tr>
            <tr>
              <th scope="row">Average session</th>
              <td>
                {comparison.indoor.avgDuration ? `${comparison.indoor.avgDuration} min` : "No data"}
              </td>
              <td>
                {comparison.outdoor.avgDuration ? `${comparison.outdoor.avgDuration} min` : "No data"}
              </td>
            </tr>
            <tr>
              <th scope="row">Average effort</th>
              <td>{comparison.indoor.avgRpe ? `${comparison.indoor.avgRpe}/10` : "No data"}</td>
              <td>{comparison.outdoor.avgRpe ? `${comparison.outdoor.avgRpe}/10` : "No data"}</td>
            </tr>
            <tr>
              <th scope="row">Average approach</th>
              <td>Not applicable</td>
              <td>
                {averageApproach(sessions ?? [], units)}
              </td>
            </tr>
          </tbody>
        </table>

        {!bothEnvironments && (
          <p className="panel-note">
            {comparison.indoor.sessions === 0 && comparison.outdoor.sessions === 0
              ? "Log an indoor session and an outdoor session to start the comparison."
              : `Only ${comparison.indoor.sessions === 0 ? "outdoor" : "indoor"} sessions are logged so far. The other column fills in after your next session.`}
          </p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>What the numbers say</h2>
            <p>Only patterns with enough climbs behind them appear here.</p>
          </div>
          <span className="badge">{plural(totalClimbs, "climb")}</span>
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
          <p className="muted">
            Log at least four climbs in each environment, across a few sessions, and the comparisons
            will start to hold their shape.
          </p>
        )}
      </section>

      <div className="panel-grid even">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Bouldering by grade</h2>
              <p>Where attempts turn into sends.</p>
            </div>
          </div>
          <GradeTable bands={boulder} preferred={preferred} />
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Rope by grade</h2>
              <p>Top rope and lead combined.</p>
            </div>
          </div>
          <GradeTable bands={rope} preferred={preferred} />
        </section>
      </div>

      <div className="panel-grid even">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Day of the week</h2>
              <p>Sessions and send rate by climbing day.</p>
            </div>
          </div>
          <table className="pattern-table">
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Sessions</th>
                <th scope="col">Climbs</th>
                <th scope="col">Send rate</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.day}>
                  <th scope="row">{day.day}</th>
                  <td>{day.sessions}</td>
                  <td>{day.climbs}</td>
                  <td>{day.climbs ? `${day.sendRate}%` : "No data"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Session length</h2>
              <p>Send rate by time on the wall.</p>
            </div>
          </div>
          <table className="pattern-table">
            <thead>
              <tr>
                <th scope="col">Length</th>
                <th scope="col">Sessions</th>
                <th scope="col">Climbs</th>
                <th scope="col">Send rate</th>
              </tr>
            </thead>
            <tbody>
              {durations.map((bucket) => (
                <tr key={bucket.label}>
                  <th scope="row">{bucket.label}</th>
                  <td>{bucket.sessions}</td>
                  <td>{bucket.climbs}</td>
                  <td>{bucket.climbs ? `${bucket.sendRate}%` : "No data"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="panel-grid even">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Effort</h2>
              <p>How hard the session felt against what got sent.</p>
            </div>
          </div>
          <table className="pattern-table">
            <thead>
              <tr>
                <th scope="col">Effort</th>
                <th scope="col">Sessions</th>
                <th scope="col">Climbs</th>
                <th scope="col">Send rate</th>
              </tr>
            </thead>
            <tbody>
              {efforts.map((bucket) => (
                <tr key={bucket.label}>
                  <th scope="row">{bucket.label}</th>
                  <td>{bucket.sessions}</td>
                  <td>{bucket.climbs}</td>
                  <td>{bucket.climbs ? `${bucket.sendRate}%` : "No data"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Style mix</h2>
              <p>Every logged climb by send style.</p>
            </div>
          </div>
          <div className="style-mix">
            {styles.map((style) => (
              <div className="style-row" key={style.style}>
                <span>{style.style}</span>
                <span className="rate-bar" aria-hidden="true">
                  <span style={{ width: `${style.share}%` }} />
                </span>
                <em>
                  {style.count} / {style.share}%
                </em>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function averageApproach(
  sessions: { environment?: "indoor" | "outdoor"; location: string; distanceKm?: number; discipline: string }[],
  units: "metric" | "imperial",
): string {
  const values = sessions
    .filter(
      (session) =>
        session.discipline !== "training" &&
        session.distanceKm !== undefined &&
        session.distanceKm > 0 &&
        environmentOf(session) === "outdoor",
    )
    .map((session) => session.distanceKm as number);
  if (values.length === 0) return "No data";
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return formatMetric("distance", average, units);
}
