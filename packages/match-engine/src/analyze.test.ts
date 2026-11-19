import { describe, expect, it } from "vitest";
import {
  analyze,
  cosineSimilarity,
  countImpactSignals,
  extractSkills,
  splitJobSkills,
} from "./index";

const resume = `
Built a React and TypeScript dashboard used by 1,200 users, cutting report time by 40%.
Designed REST APIs in Node.js backed by PostgreSQL. Deployed with Docker and GitHub Actions.
Wrote unit tests with Vitest.
`;

const job = `
Frontend Engineer

Requirements
- Strong React and TypeScript experience
- Familiarity with GraphQL
- Comfortable with Docker

Nice to have
- Playwright
- Kubernetes
`;

describe("extractSkills", () => {
  it("finds canonical skills through aliases", () => {
    const found = extractSkills("We use TS, nodejs and k8s on GCP.");
    expect(found).toEqual(expect.arrayContaining(["TypeScript", "Node.js", "Kubernetes", "GCP"]));
  });

  it("does not match skills inside other words", () => {
    expect(extractSkills("The javascripting club and reactive streams")).toEqual([]);
  });

  it("handles symbols like C++ and C#", () => {
    expect(extractSkills("Proficient in C++ and C#")).toEqual(
      expect.arrayContaining(["C++", "C#"]),
    );
  });
});

describe("splitJobSkills", () => {
  it("separates required from nice-to-have by heading", () => {
    const { required, nice } = splitJobSkills(job);
    expect(required).toEqual(expect.arrayContaining(["React", "TypeScript", "GraphQL", "Docker"]));
    expect(nice).toEqual(expect.arrayContaining(["Playwright", "Kubernetes"]));
    expect(required).not.toContain("Playwright");
  });
});

describe("analyze", () => {
  it("reports matched and missing skills", () => {
    const r = analyze(resume, job);
    expect(r.matchedRequired).toEqual(expect.arrayContaining(["React", "TypeScript", "Docker"]));
    expect(r.missingRequired).toEqual(["GraphQL"]);
    expect(r.missingNice).toEqual(expect.arrayContaining(["Playwright", "Kubernetes"]));
  });

  it("keeps the score within 0..100 and orders better resumes higher", () => {
    const weak = analyze("I like cooking.", job);
    const strong = analyze(resume, job);
    expect(weak.score).toBeGreaterThanOrEqual(0);
    expect(strong.score).toBeLessThanOrEqual(100);
    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("suggests evidence for missing required skills", () => {
    const r = analyze(resume, job);
    expect(r.suggestions.some((s) => s.includes("GraphQL"))).toBe(true);
  });

  it("is neutral on skills when the posting names none", () => {
    const r = analyze(resume, "Join our friendly team and help us grow.");
    expect(r.breakdown.skills).toBe(0.5);
  });
});

describe("text helpers", () => {
  it("cosine similarity is 1 for identical text and 0 for disjoint text", () => {
    expect(cosineSimilarity("react typescript", "react typescript")).toBeCloseTo(1);
    expect(cosineSimilarity("alpha beta", "gamma delta")).toBe(0);
  });

  it("counts quantified achievements", () => {
    expect(
      countImpactSignals("Cut latency by 40% for 1,200 users and saved $2M"),
    ).toBeGreaterThanOrEqual(3);
    expect(countImpactSignals("Worked on things")).toBe(0);
  });
});
