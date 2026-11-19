import { analyze, type MatchResult } from "@waypoint/match-engine";
import { localProvider } from "@waypoint/ai";
import type { ExtractedJob } from "./extract";

/** The only things the popup needs from the browser, so tests can swap in a fake. */
export interface Api {
  getResume(): Promise<string>;
  setResume(text: string): Promise<void>;
  extractFromActiveTab(): Promise<ExtractedJob>;
  writeClipboard(text: string): Promise<void>;
}

export const MIN_RESUME_CHARS = 80;
const MIN_JOB_CHARS = 200;

const SOURCE_NOTE: Record<ExtractedJob["source"], string> = {
  "structured-data": "Read from the page's structured job data.",
  "known-selector": "Read from the page's job description section.",
  "page-text": "No job section found, so the whole page was read. Treat the score as rough.",
};

function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function chips(doc: Document, label: string, items: string[], kind: "hit" | "miss"): HTMLElement {
  const wrap = el(doc, "div", "group");
  wrap.append(el(doc, "h3", undefined, `${label} (${items.length})`));
  const list = el(doc, "ul", "chips");
  if (items.length === 0) list.append(el(doc, "li", "none", "None"));
  for (const item of items) list.append(el(doc, "li", `chip ${kind}`, item));
  wrap.append(list);
  return wrap;
}

/** Builds the result view with textContent only. Job pages are untrusted, so no HTML is ever injected. */
export function renderResult(doc: Document, job: ExtractedJob, result: MatchResult): HTMLElement {
  const root = el(doc, "div", "result");

  const head = el(doc, "div", "score-head");
  head.append(el(doc, "div", "score", String(result.score)));
  const meta = el(doc, "div");
  meta.append(el(doc, "div", "verdict", result.verdict));
  meta.append(
    el(doc, "div", "job", [job.title, job.company].filter(Boolean).join(" · ") || "This page"),
  );
  head.append(meta);
  root.append(head);

  root.append(el(doc, "p", "note", SOURCE_NOTE[job.source]));
  root.append(chips(doc, "Required skills you show", result.matchedRequired, "hit"));
  root.append(chips(doc, "Required skills missing", result.missingRequired, "miss"));
  if (result.matchedNice.length + result.missingNice.length > 0) {
    root.append(chips(doc, "Nice to have you show", result.matchedNice, "hit"));
    root.append(chips(doc, "Nice to have missing", result.missingNice, "miss"));
  }

  const tips = el(doc, "ul", "tips");
  for (const s of result.suggestions) tips.append(el(doc, "li", undefined, s));
  root.append(el(doc, "h3", undefined, "Suggestions"), tips);
  return root;
}

export function init(doc: Document, api: Api): void {
  const $ = <T extends HTMLElement>(id: string) => {
    const node = doc.getElementById(id);
    if (!node) throw new Error(`popup.html is missing #${id}`);
    return node as T;
  };
  const resumeBox = $<HTMLTextAreaElement>("resume");
  const saveBtn = $<HTMLButtonElement>("save");
  const scoreBtn = $<HTMLButtonElement>("score");
  const letterBtn = $<HTMLButtonElement>("letter");
  const output = $("output");
  const status = $("status");

  let last: { job: ExtractedJob; resume: string } | undefined;
  const say = (msg: string, isError = false) => {
    status.textContent = msg;
    status.dataset.kind = isError ? "error" : "info";
  };

  void api.getResume().then((text) => {
    resumeBox.value = text;
    if (text.trim().length < MIN_RESUME_CHARS && !status.textContent) {
      say("Paste your resume text below, then save it.");
    }
  });

  saveBtn.addEventListener("click", async () => {
    await api.setResume(resumeBox.value);
    say("Resume saved on this device.");
  });

  scoreBtn.addEventListener("click", async () => {
    const resume = resumeBox.value;
    letterBtn.hidden = true;
    output.replaceChildren();
    if (resume.trim().length < MIN_RESUME_CHARS) {
      say("Add your resume first (at least a few lines).", true);
      return;
    }
    say("Reading this page…");
    let job: ExtractedJob;
    try {
      job = await api.extractFromActiveTab();
    } catch {
      say("Waypoint can't read this page. Try a normal job posting tab.", true);
      return;
    }
    if (job.text.length < MIN_JOB_CHARS) {
      say("Couldn't find a job description on this page.", true);
      return;
    }
    const result = analyze(resume, job.text);
    output.replaceChildren(renderResult(doc, job, result));
    last = { job, resume };
    letterBtn.hidden = false;
    say("");
  });

  letterBtn.addEventListener("click", async () => {
    if (!last) return;
    const letter = await localProvider.coverLetter({
      resume: last.resume,
      jobDescription: last.job.text,
      company: last.job.company || "the",
      role: last.job.title || "open",
    });
    await api.writeClipboard(letter);
    say("Cover letter draft copied. It only mentions skills found in your resume.");
  });
}
