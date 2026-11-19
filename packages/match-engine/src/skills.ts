/**
 * Curated skill taxonomy: canonical name -> aliases (all lowercase).
 * Kept deliberately small and explicit so matching is predictable and testable.
 */
export const SKILLS: Record<string, string[]> = {
  TypeScript: ["typescript", "ts"],
  JavaScript: ["javascript", "js", "ecmascript", "es6"],
  Python: ["python", "python3"],
  Java: ["java"],
  "C++": ["c++", "cpp"],
  "C#": ["c#", "csharp"],
  C: ["c programming", "c language"],
  Go: ["golang"],
  Rust: ["rust"],
  Kotlin: ["kotlin"],
  Swift: ["swift"],
  SQL: ["sql", "t-sql", "plsql"],
  React: ["react", "react.js", "reactjs"],
  "Next.js": ["next.js", "nextjs"],
  "Node.js": ["node.js", "nodejs", "node"],
  Vue: ["vue", "vue.js", "vuejs"],
  Angular: ["angular"],
  Svelte: ["svelte", "sveltekit"],
  HTML: ["html", "html5"],
  CSS: ["css", "css3", "scss", "sass"],
  Tailwind: ["tailwind", "tailwindcss"],
  GraphQL: ["graphql"],
  "REST APIs": ["rest", "restful", "rest api", "rest apis"],
  Express: ["express", "express.js", "expressjs"],
  Django: ["django"],
  Flask: ["flask"],
  FastAPI: ["fastapi"],
  "Spring Boot": ["spring", "spring boot"],
  PostgreSQL: ["postgresql", "postgres"],
  MySQL: ["mysql"],
  MongoDB: ["mongodb", "mongo"],
  Redis: ["redis"],
  SQLite: ["sqlite"],
  Prisma: ["prisma"],
  AWS: ["aws", "amazon web services", "ec2", "s3", "lambda"],
  GCP: ["gcp", "google cloud"],
  Azure: ["azure"],
  Docker: ["docker", "containers", "containerization"],
  Kubernetes: ["kubernetes", "k8s"],
  Terraform: ["terraform"],
  "CI/CD": ["ci/cd", "cicd", "github actions", "jenkins", "continuous integration"],
  Git: ["git", "github", "gitlab"],
  Linux: ["linux", "unix", "bash", "shell scripting"],
  Testing: [
    "unit testing",
    "integration testing",
    "jest",
    "vitest",
    "pytest",
    "tdd",
    "test-driven",
  ],
  Playwright: ["playwright", "cypress", "selenium"],
  "Machine Learning": ["machine learning", "ml", "scikit-learn", "sklearn"],
  "Deep Learning": ["deep learning", "neural networks", "pytorch", "tensorflow"],
  LLMs: [
    "llm",
    "llms",
    "large language models",
    "prompt engineering",
    "rag",
    "openai",
    "anthropic",
    "claude",
  ],
  "Data Analysis": ["data analysis", "pandas", "numpy", "data analytics"],
  "Data Visualization": ["data visualization", "tableau", "power bi", "d3", "d3.js"],
  Agile: ["agile", "scrum", "kanban", "sprint"],
  "System Design": ["system design", "distributed systems", "microservices", "scalability"],
  "Data Structures": ["data structures", "algorithms"],
  "Technical Writing": ["technical writing", "documentation"],
  Figma: ["figma"],
  "Product Sense": ["product management", "product sense", "user research", "roadmap"],
  Communication: ["communication", "stakeholder", "cross-functional", "collaboration"],
  Leadership: ["leadership", "mentoring", "team lead"],
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");

interface CompiledSkill {
  name: string;
  pattern: RegExp;
}

const COMPILED: CompiledSkill[] = Object.entries(SKILLS).map(([name, aliases]) => {
  const alt = [name.toLowerCase(), ...aliases].map(escapeRegExp).join("|");
  return { name, pattern: new RegExp(`(?<![a-z0-9+#])(?:${alt})(?![a-z0-9+#])`, "i") };
});

/** Returns canonical skill names found in `text`. */
export function extractSkills(text: string): string[] {
  return COMPILED.filter((s) => s.pattern.test(text)).map((s) => s.name);
}
