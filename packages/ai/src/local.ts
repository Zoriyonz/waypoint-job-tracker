import { analyze } from "@waypoint/match-engine";
import type { AIProvider, LetterInput } from "./types";

const list = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/**
 * Deterministic, offline provider. It needs no API key, so the whole product
 * works out of the box. It grounds the letter in the skills the match engine
 * actually found in the resume, so it never claims skills the candidate lacks.
 */
export const localProvider: AIProvider = {
  name: "local",
  async coverLetter({ resume, jobDescription, company, role }: LetterInput) {
    const result = analyze(resume, jobDescription);
    const strengths = result.matchedRequired.slice(0, 4);
    const growth = result.missingRequired.slice(0, 2);

    const opening = `I'm excited to apply for the ${role} role at ${company}.`;
    const body = strengths.length
      ? `My background lines up with what you're looking for: I've worked hands-on with ${list(strengths)}, and I like turning that into shipped, measurable results.`
      : `I'm a fast learner who ships, and I'd love to bring that energy to your team.`;
    const learning = growth.length
      ? `I'm also actively building depth in ${list(growth)}, and I pick up new tools quickly by building real projects with them.`
      : `I'm comfortable owning work end to end, from first idea to production.`;
    const close = `I'd welcome the chance to talk about how I can contribute to ${company}. Thank you for your time and consideration.`;

    return [`Dear ${company} hiring team,`, opening, body, learning, close, "Sincerely,"].join(
      "\n\n",
    );
  },
};
