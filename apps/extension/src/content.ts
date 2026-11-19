import { extractJob } from "./extract";

/**
 * Injected on demand by the popup (never declared as an always-on content script).
 * The build appends a footer that evaluates `extract()` so executeScript receives its value.
 */
export const extract = () => extractJob(document);
