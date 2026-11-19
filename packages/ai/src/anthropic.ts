import type { AIProvider, LetterInput } from "./types";

const SYSTEM =
  "You write concise, specific cover letters (170-230 words). Use only facts present in the resume. " +
  "Never invent employers, degrees, numbers or skills. Plain text, no markdown, no placeholders.";

export function anthropicProvider(apiKey: string, model = "claude-sonnet-5-5"): AIProvider {
  return {
    name: "anthropic",
    async coverLetter({ resume, jobDescription, company, role }: LetterInput) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 700,
          system: SYSTEM,
          messages: [
            {
              role: "user",
              content: `Company: ${company}\nRole: ${role}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nRESUME:\n${resume}\n\nWrite the cover letter.`,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic API returned ${res.status}`);
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = data.content?.find((c) => c.type === "text")?.text?.trim();
      if (!text) throw new Error("Anthropic API returned no text");
      return text;
    },
  };
}
