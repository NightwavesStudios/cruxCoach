import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Reuse the existing hand-written lesson pages without duplicating their
 * content. Only the article body is extracted; the old shell is discarded.
 */
export function lessonBody(id: string): string {
  const file = join(process.cwd(), "train", "lessons", `${id}.html`);
  const html = readFileSync(file, "utf8");

  const startMarker = '<div id="contentContainer">';
  const start = html.indexOf(startMarker);
  if (start === -1) return "";

  const end = html.indexOf("<nav>", start);
  let body = html.slice(start + startMarker.length, end === -1 ? undefined : end);

  body = body
    .replace(/<!-- Read Next Button Container -->[\s\S]*$/i, "")
    .replace(/<div id="readNextContainer">[\s\S]*$/i, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/href="\/train\/lessons\/([a-z0-9-]+)\.html"/g, 'href="/train/$1"')
    .replace(/href="\/dashboard\.html"/g, 'href="/app"')
    .replace(/href="\/learn\/index\.html"/g, 'href="/app/learn"')
    .replace(/href="\/train\/index\.html"/g, 'href="/app/train"')
    .replace(/(<br>\s*)+$/i, "")
    .trim();

  return body;
}
