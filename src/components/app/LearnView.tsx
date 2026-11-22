import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { COLLECTIONS, contentForCollection } from "../../data/content";
import { db } from "../../lib/db";

export default function LearnView() {
  const progress = useLiveQuery(() => db.contentProgress.toArray(), []);

  const done = useMemo(
    () => new Set((progress ?? []).filter((item) => item.status === "done").map((item) => item.contentId)),
    [progress],
  );

  const modules = COLLECTIONS.map((collection) => {
    const lessons = contentForCollection(collection.id);
    const completed = lessons.filter((lesson) => done.has(lesson.id)).length;
    return { ...collection, lessons, completed };
  });

  const total = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const completedTotal = modules.reduce((sum, module) => sum + module.completed, 0);

  async function toggleDone(contentId: string) {
    if (done.has(contentId)) {
      await db.contentProgress.delete(contentId);
    } else {
      await db.contentProgress.put({
        contentId,
        status: "done",
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Lessons</p>
          <h1>Learn</h1>
          <p className="page-sub">
            Short, practical modules on holds, angles and style. Take the drills to the wall.
          </p>
        </div>
        <span className="badge">
          {completedTotal} / {total} complete
        </span>
      </header>

      <div className="module-grid">
        {modules.map((module) => {
          const percent = module.lessons.length
            ? Math.round((module.completed / module.lessons.length) * 100)
            : 0;
          return (
            <section className="panel module-card" key={module.id}>
              <div className="panel-head">
                <div>
                  <h2>{module.title}</h2>
                  <p>{module.description}</p>
                </div>
                <span className="badge">{percent}%</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${percent}%` }} />
              </div>
              <ul className="lesson-list">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <button
                      className={done.has(lesson.id) ? "check-button done" : "check-button"}
                      aria-label={`${done.has(lesson.id) ? "Mark not done" : "Mark done"}: ${lesson.title}`}
                      onClick={() => toggleDone(lesson.id)}
                    >
                      {done.has(lesson.id) ? "✓" : ""}
                    </button>
                    <div>
                      <a href={`/train/${lesson.id}`}>{lesson.title}</a>
                      <small>
                        {lesson.type}, {lesson.length}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
