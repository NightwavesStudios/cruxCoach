import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const files = await readdir(`${dist}_astro`);
const assets = files
  .filter((file) => /\.(js|css|woff2?|png|svg|webp)$/.test(file))
  .map((file) => `/_astro/${file}`);

const swPath = `${dist}sw.js`;
const sw = await readFile(swPath, "utf8");
const marker = "const BUILD_ASSETS = [];";
if (!sw.includes(marker)) throw new Error("Service worker asset marker not found.");

await writeFile(swPath, sw.replace(marker, `const BUILD_ASSETS = ${JSON.stringify(assets)};`));
console.log(`Precached ${assets.length} build assets in dist/sw.js`);
