import { CONTENT, type ContentItem } from "../data/content";
import { traitTag, type TraitScore } from "./traits";
import type { ContentProgress } from "./types";

export function recommendContent(
  focus: TraitScore[],
  progress: ContentProgress[] = [],
  limit = 4,
): ContentItem[] {
  if (focus.length === 0) return [];
  const tags = new Set(focus.map((trait) => traitTag(trait.key)));
  const done = new Set(progress.filter((item) => item.status === "done").map((item) => item.contentId));

  return CONTENT.filter((item) => !done.has(item.id))
    .map((item) => ({
      item,
      score:
        item.tags.filter((tag) => tags.has(tag)).length * 3 +
        (item.collection === "training" ? 1 : 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .slice(0, limit)
    .map((entry) => entry.item);
}
