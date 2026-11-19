import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(new URL(`../public/${p}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("manifest.json")) as {
  manifest_version: number;
  permissions: string[];
  host_permissions?: string[];
  content_scripts?: unknown[];
  background?: unknown;
  action: { default_popup: string; default_icon: Record<string, string> };
  icons: Record<string, string>;
  content_security_policy: { extension_pages: string };
};

describe("manifest.json", () => {
  it("is Manifest V3", () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it("asks for the minimum: activeTab, scripting, storage, and no host access", () => {
    expect([...manifest.permissions].sort()).toEqual(["activeTab", "scripting", "storage"]);
    expect(manifest.host_permissions).toBeUndefined();
  });

  it("injects nothing on its own: no always-on content scripts or background worker", () => {
    expect(manifest.content_scripts).toBeUndefined();
    expect(manifest.background).toBeUndefined();
  });

  it("locks extension pages to their own scripts", () => {
    const csp = manifest.content_security_policy.extension_pages;
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/unsafe-eval|unsafe-inline|https?:/);
  });

  it("references only files that exist", () => {
    const files = [
      manifest.action.default_popup,
      ...Object.values(manifest.icons),
      ...Object.values(manifest.action.default_icon),
    ];
    for (const f of files)
      expect(existsSync(new URL(`../public/${f}`, import.meta.url)), f).toBe(true);
  });

  it("popup.html loads only local assets", () => {
    const html = read("popup.html");
    expect(html).not.toMatch(/(src|href)="https?:/);
    expect(html).toContain('src="popup.js"');
  });
});
