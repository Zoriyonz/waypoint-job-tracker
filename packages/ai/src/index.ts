import { anthropicProvider } from "./anthropic";
import { localProvider } from "./local";
import type { AIProvider, LetterInput, LetterResult } from "./types";

export type { AIProvider, LetterInput, LetterResult } from "./types";
export { localProvider } from "./local";
export { anthropicProvider } from "./anthropic";

/** Picks Anthropic when a key is configured, otherwise the offline provider. */
export function resolveProvider(env: Record<string, string | undefined>): AIProvider {
  const key = env.ANTHROPIC_API_KEY;
  return key ? anthropicProvider(key, env.ANTHROPIC_MODEL || undefined) : localProvider;
}

/** Generates a letter; if the hosted provider fails, degrades gracefully to local. */
export async function generateCoverLetter(
  input: LetterInput,
  env: Record<string, string | undefined>,
): Promise<LetterResult> {
  const provider = resolveProvider(env);
  try {
    return { letter: await provider.coverLetter(input), provider: provider.name };
  } catch {
    return { letter: await localProvider.coverLetter(input), provider: "local" };
  }
}
