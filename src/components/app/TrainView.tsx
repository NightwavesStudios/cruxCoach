import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { COLLECTIONS, CONTENT, type CollectionId, type ContentItem, type ContentType } from "../../data/content";
import { db } from "../../lib/db";
import { recommendContent } from "../../lib/recommend";
import { computeTraitScores, focusAreas } from "../../lib/traits";
import type { ContentProgress } from "../../lib/types";

const TYPES: ContentType[] = ["Article", "Workout", "Practice"];

export default function TrainView() {
  const reflections = useLiveQuery(() => db.reflections.toArray(), []);
  const progress = useLiveQuery(() => db.contentProgress.toArray(), []);

  const [collection, setCollection] = useState<CollectionId | "all">("all");
  const [type, setType] = useState<ContentType | "all">("all");
  const [search, setSearch] = useState("");

  const focus = useMemo(() => focusAreas(computeTraitScores(reflections ?? [])), [reflections]);
  const recommended = useMemo(
    () => recommendContent(focus, progress ?? []),
    [focus, progress],
  );

  const progressMap = useMemo(() => {
    const map = new Map<string, ContentProgress["status"]>();
    for (const item of progress ?? []) map.set(item.contentId, item.status);
    return map;
  }, [progress]);

  const filtered = useMemo(() => {
    return CONTENT.filter((item) => {
      if (collection !== "all" && item.collection !== collection) return false;
      if (type !== "all" && item.type !== type) return false;
      if (search.trim()) {
        const haystack = `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(search.trim().toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [collection, type, search]);

  async function setStatus(item: ContentItem, status: ContentProgress["status"] | null) {
    if (!status) {
      await db.contentProgress.delete(item.id);
      return;
    }
    await db.contentProgress.put({
      contentId: item.id,
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="stack">
      <header className="page-head">
        <div>
          <p className="page-kicker">Library</p>
          <h1>Train</h1>
          <p className="page-sub">
            Drills, workouts and guides matched to what your reflections say needs work.
          </p>
        </div>
        <div className="page-actions">
          <a className="btn btn-secondary" href="/app/learn">
            Learn
          </a>
        </div>
      </header>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Recommended for you</h2>
            <p>
              {focus.length
                ? `Based on your lowest-rated traits: ${focus.map((trait) => trait.label).join(", ")}.`
                : "Reflect on three sessions and recommendations appear here."}
            </p>
          </div>
          {focus.length > 0 && <span className="badge">{focus.length} focus areas</span>}
        </div>

        {recommended.length ? (
          <div className="content-grid">
            {recommended.map((item) => (
              <ContentCard
                item={item}
                key={item.id}
                status={progressMap.get(item.id)}
                onStatus={setStatus}
              />
            ))}
          </div>
        ) : (
          <p className="muted">
            {focus.length
              ? "You have completed the matching content. Explore the full library below."
              : "More reflections make these suggestions more specific."}
          </p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>All content</h2>
            <p>{filtered.length} items in the library.</p>
          </div>
        </div>

        <div className="toolbar wrap">
          <div className="chips">
            <button
              className={collection === "all" ? "chip active" : "chip"}
              onClick={() => setCollection("all")}
              aria-pressed={collection === "all"}
            >
              All
            </button>
            {COLLECTIONS.map((item) => (
              <button
                key={item.id}
                className={collection === item.id ? "chip active" : "chip"}
                onClick={() => setCollection(item.id)}
                aria-pressed={collection === item.id}
              >
                {item.title}
              </button>
            ))}
          </div>

          <div className="filter-row">
            <label className="field compact search-field">
              <span className="sr-only">Search content</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search lessons"
              />
            </label>
            <label className="field compact">
              <span className="sr-only">Type</span>
              <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
                <option value="all">All types</option>
                {TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {filtered.length ? (
          <div className="content-grid">
            {filtered.map((item) => (
              <ContentCard
                item={item}
                key={item.id}
                status={progressMap.get(item.id)}
                onStatus={setStatus}
              />
            ))}
          </div>
        ) : (
          <p className="muted">No content matches that search.</p>
        )}
      </section>
    </div>
  );
}

function ContentCard({
  item,
  status,
  onStatus,
}: {
  item: ContentItem;
  status?: ContentProgress["status"];
  onStatus: (item: ContentItem, status: ContentProgress["status"] | null) => void;
}) {
  return (
    <article className="content-card">
      <a className="content-tile" href={`/train/${item.id}`} aria-label={item.title}>
        <span>{item.type}</span>
        <strong>{item.title.charAt(0)}</strong>
        <small>{item.length}</small>
      </a>
      <div className="content-body">
        <div className="content-meta">
          <span className={`type-tag ${item.collection}`}>{item.collection}</span>
          <span>{item.type}</span>
          <span>{item.length}</span>
        </div>
        <h3>
          <a href={`/train/${item.id}`}>{item.title}</a>
        </h3>
        <p>{item.summary}</p>
        <div className="content-actions">
          <button
            className={status === "saved" ? "text-button active" : "text-button"}
            onClick={() => onStatus(item, status === "saved" ? null : "saved")}
          >
            {status === "saved" ? "Saved" : "Save"}
          </button>
          <button
            className={status === "done" ? "text-button active" : "text-button"}
            onClick={() => onStatus(item, status === "done" ? null : "done")}
          >
            {status === "done" ? "Done ✓" : "Mark done"}
          </button>
        </div>
      </div>
    </article>
  );
}
