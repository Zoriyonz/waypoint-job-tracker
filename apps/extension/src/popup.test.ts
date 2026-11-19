// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExtractedJob } from "./extract";
import { init, type Api } from "./popup";

const HTML = readFileSync(join(process.cwd(), "public/popup.html"), "utf8");

const RESUME = `Second-year Computer Science student.
- Built a React and TypeScript study planner used by 300 classmates; cut planning time by 35%.
- Designed REST APIs in Node.js with PostgreSQL; deployed with Docker and GitHub Actions.
- Wrote unit tests with Vitest, reaching 85% coverage. Used Git and Python.`;

const JOB: ExtractedJob = {
  title: "Frontend Engineer Intern",
  company: "Northwind Labs",
  source: "structured-data",
  text: `Requirements
- Strong React and TypeScript experience
- Experience writing tests with Vitest
- Comfortable with Git
Nice to have
- GraphQL
- Docker
${"We build tools people enjoy using every day. ".repeat(6)}`,
};

function setup(overrides: Partial<Api> = {}) {
  document.body.innerHTML = HTML.match(/<body>([\s\S]*)<\/body>/)![1]!.replace(
    /<script[\s\S]*?<\/script>/,
    "",
  );
  const api: Api = {
    getResume: vi.fn(async () => RESUME),
    setResume: vi.fn(async () => {}),
    extractFromActiveTab: vi.fn(async () => JOB),
    writeClipboard: vi.fn(async () => {}),
    ...overrides,
  };
  init(document, api);
  const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const click = async (id: string) => {
    $(id).click();
    await vi.waitFor(() => expect(true).toBe(true));
    await new Promise((r) => setTimeout(r, 0));
  };
  return { api, $, click };
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("popup", () => {
  it("loads the saved resume into the textarea", async () => {
    const { $ } = setup();
    await vi.waitFor(() => expect($<HTMLTextAreaElement>("resume").value).toBe(RESUME));
  });

  it("asks for a resume when none is saved", async () => {
    const { $ } = setup({ getResume: async () => "" });
    await vi.waitFor(() => expect($("status").textContent).toMatch(/Paste your resume/));
  });

  it("saves the resume", async () => {
    const { api, $, click } = setup();
    await vi.waitFor(() => expect($<HTMLTextAreaElement>("resume").value).toBe(RESUME));
    await click("save");
    expect(api.setResume).toHaveBeenCalledWith(RESUME);
    expect($("status").textContent).toMatch(/saved on this device/);
  });

  it("scores the page with the shared match engine and shows matches and gaps", async () => {
    const { $, click } = setup();
    await vi.waitFor(() => expect($<HTMLTextAreaElement>("resume").value).toBe(RESUME));
    await click("score");
    const out = $("output");
    expect(Number(out.querySelector(".score")?.textContent)).toBeGreaterThan(0);
    expect(out.querySelector(".verdict")?.textContent).toMatch(/match|Stretch|Long shot/);
    expect(out.querySelector(".job")?.textContent).toBe(
      "Frontend Engineer Intern · Northwind Labs",
    );
    const hits = [...out.querySelectorAll(".chip.hit")].map((n) => n.textContent);
    expect(hits).toEqual(expect.arrayContaining(["React", "TypeScript"]));
    expect(out.querySelectorAll(".chip.miss").length).toBeGreaterThan(0);
    expect($("letter").hidden).toBe(false);
  });

  it("refuses to score without a resume", async () => {
    const { api, $, click } = setup({ getResume: async () => "" });
    await vi.waitFor(() => expect($("status").textContent).toMatch(/Paste your resume/));
    await click("score");
    expect($("status").dataset.kind).toBe("error");
    expect(api.extractFromActiveTab).not.toHaveBeenCalled();
  });

  it("explains when the page cannot be read", async () => {
    const { $, click } = setup({
      extractFromActiveTab: async () => {
        throw new Error("Cannot access chrome:// URLs");
      },
    });
    await vi.waitFor(() => expect($<HTMLTextAreaElement>("resume").value).toBe(RESUME));
    await click("score");
    expect($("status").textContent).toMatch(/can't read this page/);
    expect($("output").children).toHaveLength(0);
  });

  it("explains when no job description is found", async () => {
    const { $, click } = setup({
      extractFromActiveTab: async () => ({ ...JOB, text: "Home | About | Contact" }),
    });
    await vi.waitFor(() => expect($<HTMLTextAreaElement>("resume").value).toBe(RESUME));
    await click("score");
    expect($("status").textContent).toMatch(/Couldn't find a job description/);
  });

  it("renders untrusted page text as text, never as HTML", async () => {
    const evil = { ...JOB, title: '<img src=x onerror="alert(1)">', company: "<b>Acme</b>" };
    const { $, click } = setup({ extractFromActiveTab: async () => evil });
    await vi.waitFor(() => expect($<HTMLTextAreaElement>("resume").value).toBe(RESUME));
    await click("score");
    expect($("output").querySelector("img")).toBeNull();
    expect($("output").querySelector("b")).toBeNull();
    expect($("output").querySelector(".job")?.textContent).toContain("<b>Acme</b>");
  });

  it("warns that a whole-page read is only a rough score", async () => {
    const { $, click } = setup({
      extractFromActiveTab: async () => ({ ...JOB, source: "page-text" }),
    });
    await vi.waitFor(() => expect($<HTMLTextAreaElement>("resume").value).toBe(RESUME));
    await click("score");
    expect($("output").querySelector(".note")?.textContent).toMatch(/rough/);
  });

  it("copies an offline cover letter that only claims skills in the resume", async () => {
    const { api, $, click } = setup();
    await vi.waitFor(() => expect($<HTMLTextAreaElement>("resume").value).toBe(RESUME));
    await click("score");
    await click("letter");
    const letter = vi.mocked(api.writeClipboard).mock.calls[0]![0];
    expect(letter).toContain("Northwind Labs");
    expect(letter).toContain("React");
    expect(letter).not.toContain("GraphQL");
    expect($("status").textContent).toMatch(/copied/);
  });
});
