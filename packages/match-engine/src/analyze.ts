import { extractSkills } from "./skills";
import { cosineSimilarity, countImpactSignals } from "./text";

export type Verdict = "Strong match" | "Good match" | "Stretch" | "Long shot";

export interface MatchResult {
  /** 0..100 overall score */
  score: number;
  verdict: Verdict;
  matchedRequired: string[];
  missingRequired: string[];
  matchedNice: string[];
  missingNice: string[];
  breakdown: {
    skills: number; // 0..1
    relevance: number; // 0..1
    impact: number; // 0..1
  };
  suggestions: string[];
}

const NICE_HEADING = /nice to have|preferred|bonus|a plus|assets?\b|good to have/i;
const REQUIRED_HEADING =
  /requirements?|qualifications?|responsibilit|what you('|’)?ll|must have|you have|about you/i;

/**
 * Splits a job description's skills into "required" and "nice to have"
 * by tracking section headings (short lines) as the text is scanned.
 */
export function splitJobSkills(job: string): { required: string[]; nice: string[] } {
  const required = new Set<string>();
  const nice = new Set<string>();
  let mode: "required" | "nice" = "required";

  for (const rawLine of job.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const isHeading = line.length < 48 && !/[.;]$/.test(line);
    if (isHeading && NICE_HEADING.test(line)) mode = "nice";
    else if (isHeading && REQUIRED_HEADING.test(line)) mode = "required";

    const lineMode = NICE_HEADING.test(line) && !isHeading ? "nice" : mode;
    for (const skill of extractSkills(line)) {
      (lineMode === "nice" ? nice : required).add(skill);
    }
  }
  for (const s of required) nice.delete(s);
  return { required: [...required], nice: [...nice] };
}

function verdictFor(score: number): Verdict {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Stretch";
  return "Long shot";
}

export function analyze(resume: string, job: string): MatchResult {
  const resumeSkills = new Set(extractSkills(resume));
  const { required, nice } = splitJobSkills(job);

  const matchedRequired = required.filter((s) => resumeSkills.has(s));
  const missingRequired = required.filter((s) => !resumeSkills.has(s));
  const matchedNice = nice.filter((s) => resumeSkills.has(s));
  const missingNice = nice.filter((s) => !resumeSkills.has(s));

  const weightTotal = required.length + nice.length * 0.5;
  const skills =
    weightTotal === 0 ? 0.5 : (matchedRequired.length + matchedNice.length * 0.5) / weightTotal;

  // raw cosine for resume-vs-JD prose rarely exceeds ~0.4, so rescale
  const relevance = Math.min(1, cosineSimilarity(resume, job) / 0.4);
  const impact = Math.min(1, countImpactSignals(resume) / 6);

  const score = Math.round(100 * (0.6 * skills + 0.25 * relevance + 0.15 * impact));

  const suggestions: string[] = [];
  for (const s of missingRequired.slice(0, 3)) {
    suggestions.push(
      `Show real evidence of ${s}: a project, coursework or a bullet that names it.`,
    );
  }
  if (impact < 0.5) {
    suggestions.push(
      "Quantify results (percentages, users, time saved) so bullets read as outcomes, not duties.",
    );
  }
  if (relevance < 0.5) {
    suggestions.push(
      "Mirror the posting's language where it's truthful: reuse its domain terms in your bullets.",
    );
  }
  if (suggestions.length === 0)
    suggestions.push(
      "Strong alignment. Tailor your first bullet to the role's top responsibility.",
    );

  return {
    score,
    verdict: verdictFor(score),
    matchedRequired,
    missingRequired,
    matchedNice,
    missingNice,
    breakdown: { skills, relevance, impact },
    suggestions,
  };
}
