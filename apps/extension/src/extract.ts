export interface ExtractedJob {
  title: string;
  company: string;
  /** Plain-text job description, capped at MAX_CHARS. */
  text: string;
  /** Which strategy found the text, so the UI can say how confident to be. */
  source: "structured-data" | "known-selector" | "page-text";
}

export const MAX_CHARS = 20_000;

/** Containers used by common applicant tracking systems, tried in order. */
const SELECTORS = [
  ".show-more-less-html__markup", // LinkedIn (logged out)
  ".jobs-description__content", // LinkedIn (logged in)
  "#jobDescriptionText", // Indeed
  "#content .section-wrapper", // Greenhouse (legacy)
  "#app_body", // Greenhouse
  ".posting-page .content", // Lever
  '[data-automation-id="jobPostingDescription"]', // Workday
  '[data-testid="job-description"]',
  "article",
  "main",
];

const collapse = (s: string) =>
  s
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();

/**
 * Page content is untrusted. DOMParser builds an inert document, so markup in a
 * description can never load images, run handlers or execute scripts, and only
 * its text is kept.
 */
function htmlToText(html: string): string {
  const inert = new DOMParser().parseFromString(
    html.replace(/<br\s*\/?>|<\/?(?:p|li|div|ul|ol|tr|h[1-6])\b[^>]*>/gi, "\n$&"),
    "text/html",
  );
  return collapse(inert.body.textContent ?? "");
}

interface JobPostingLd {
  "@type"?: string | string[];
  title?: string;
  description?: string;
  hiringOrganization?: string | { name?: string };
  "@graph"?: unknown[];
}

const isJobPosting = (o: unknown): o is JobPostingLd => {
  if (typeof o !== "object" || o === null) return false;
  const t = (o as JobPostingLd)["@type"];
  return t === "JobPosting" || (Array.isArray(t) && t.includes("JobPosting"));
};

function* walk(value: unknown): Generator<unknown> {
  yield value;
  if (Array.isArray(value)) for (const v of value) yield* walk(v);
  else if (typeof value === "object" && value !== null && "@graph" in value) {
    yield* walk((value as JobPostingLd)["@graph"]);
  }
}

function fromStructuredData(doc: Document): ExtractedJob | undefined {
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    let data: unknown;
    try {
      data = JSON.parse(script.textContent ?? "");
    } catch {
      continue;
    }
    for (const node of walk(data)) {
      if (!isJobPosting(node) || typeof node.description !== "string") continue;
      const org = node.hiringOrganization;
      return {
        title: typeof node.title === "string" ? node.title : "",
        company: typeof org === "string" ? org : (org?.name ?? ""),
        text: htmlToText(node.description).slice(0, MAX_CHARS),
        source: "structured-data",
      };
    }
  }
  return undefined;
}

const MIN_USEFUL_CHARS = 200;

export function extractJob(doc: Document): ExtractedJob {
  const structured = fromStructuredData(doc);
  if (structured && structured.text.length >= MIN_USEFUL_CHARS) return structured;

  const meta = (name: string) =>
    doc.querySelector<HTMLMetaElement>(`meta[property="${name}"]`)?.content?.trim() ?? "";
  const title = structured?.title || doc.querySelector("h1")?.textContent?.trim() || doc.title;
  const company = structured?.company || meta("og:site_name");

  for (const sel of SELECTORS) {
    const text = collapse(
      doc.querySelector<HTMLElement>(sel)?.innerText ?? doc.querySelector(sel)?.textContent ?? "",
    );
    if (text.length >= MIN_USEFUL_CHARS) {
      return { title, company, text: text.slice(0, MAX_CHARS), source: "known-selector" };
    }
  }

  const body = collapse(doc.body?.innerText ?? doc.body?.textContent ?? "");
  return { title, company, text: body.slice(0, MAX_CHARS), source: "page-text" };
}
