const STOPWORDS = new Set(
  (
    "a an the and or but if then of to in on for with at by from as is are was were be been being it its this that these those " +
    "you your we our they their i he she him her them us not no yes do does did done have has had will would can could should may might " +
    "about into over under again more most other some such only own same so than too very just also etc per via within across including " +
    "work working role team company years year experience ability strong looking join us who what when where which while must need needs"
  ).split(" "),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  // sublinear scaling keeps repeated words from dominating
  for (const [k, v] of tf) tf.set(k, 1 + Math.log(v));
  return tf;
}

/** Cosine similarity between two texts using sublinear term frequency. Range 0..1. */
export function cosineSimilarity(a: string, b: string): number {
  const ta = termFrequency(tokenize(a));
  const tb = termFrequency(tokenize(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let dot = 0;
  for (const [k, v] of ta) {
    const w = tb.get(k);
    if (w) dot += v * w;
  }
  const norm = (m: Map<string, number>) => Math.sqrt([...m.values()].reduce((s, v) => s + v * v, 0));
  return dot / (norm(ta) * norm(tb));
}

/** Counts quantified achievements like "40%", "$2M", "12 services", "3x". */
export function countImpactSignals(text: string): number {
  const matches = text.match(/(\$\s?\d[\d,.]*\s?[kmb]?\b|\b\d[\d,.]*\s?(%|x\b|k\b|m\b|ms\b|users\b|services\b|engineers\b))/gi);
  return matches ? matches.length : 0;
}
