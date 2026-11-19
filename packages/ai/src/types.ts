export interface LetterInput {
  resume: string;
  jobDescription: string;
  company: string;
  role: string;
}

export interface LetterResult {
  letter: string;
  /** Which provider actually produced the text. */
  provider: "local" | "anthropic";
}

export interface AIProvider {
  readonly name: LetterResult["provider"];
  coverLetter(input: LetterInput): Promise<string>;
}
