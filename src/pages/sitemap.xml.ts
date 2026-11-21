import type { APIRoute } from "astro";
import { CONTENT } from "../data/content";

export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL("https://cruxcoach.vercel.app")).toString().replace(/\/$/, "");
  const paths = ["/", ...CONTENT.map((item) => `/train/${item.id}`)];
  const urls = paths
    .map((path) => `  <url><loc>${base}${path}</loc></url>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
