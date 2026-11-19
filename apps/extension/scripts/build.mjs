// Bundles the extension into dist/ so it can be loaded unpacked at chrome://extensions.
import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = `${root}dist`;

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const shared = { bundle: true, target: "chrome111", minify: false, logLevel: "warning" };

// The popup page script.
await build({
  ...shared,
  entryPoints: [`${root}src/main.ts`],
  outfile: `${dist}/popup.js`,
  format: "iife",
});

// Injected into the active tab on demand. As an IIFE bound to a global, then a footer that
// evaluates it, so chrome.scripting.executeScript receives the extraction result as its value.
await build({
  ...shared,
  entryPoints: [`${root}src/content.ts`],
  outfile: `${dist}/content.js`,
  format: "iife",
  globalName: "__waypoint",
  footer: { js: "__waypoint.extract();" },
});

await cp(`${root}public`, dist, { recursive: true });
console.log("Built extension to apps/extension/dist");
