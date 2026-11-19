import type { Application } from "./types";

export const SEED_RESUME = `Second-year Computer Science student.

Projects
- Built a React and TypeScript study planner used by 300 classmates; cut weekly planning time by 35%.
- Designed REST APIs in Node.js with PostgreSQL; deployed with Docker and GitHub Actions.
- Wrote unit tests with Vitest and Playwright, reaching 85% coverage.
- Trained a scikit-learn model in Python to classify support tickets with 91% accuracy.

Experience
- Teaching assistant for Data Structures and Algorithms; mentored 40 students and ran weekly office hours.
- Used Git, Linux and Agile sprints on a 5-person team shipping every 2 weeks.`;

const now = Date.now();

export const SEED_APPS: Application[] = [
  {
    id: "seed-1",
    company: "Northwind Labs",
    role: "Frontend Engineer Intern",
    location: "Vancouver, BC",
    stage: "interview",
    createdAt: now - 5 * 864e5,
    description: `Frontend Engineer Intern

Requirements
- Strong React and TypeScript experience
- Experience writing tests with Vitest or Playwright
- Comfortable with Git and Agile teams

Nice to have
- GraphQL
- Docker`,
  },
  {
    id: "seed-2",
    company: "Cedar AI",
    role: "ML Engineering Intern",
    location: "Remote",
    stage: "applied",
    createdAt: now - 3 * 864e5,
    description: `ML Engineering Intern

Requirements
- Python and machine learning fundamentals (scikit-learn, pandas)
- Experience with LLMs and prompt engineering
- Familiarity with AWS

Nice to have
- Kubernetes
- Terraform`,
  },
  {
    id: "seed-3",
    company: "Orbital Pay",
    role: "Backend Developer Co-op",
    location: "Toronto, ON",
    stage: "wishlist",
    createdAt: now - 2 * 864e5,
    description: `Backend Developer Co-op

Requirements
- Node.js, PostgreSQL and REST API design
- Experience with Docker and CI/CD
- Strong grasp of data structures and system design

Nice to have
- Redis
- Go`,
  },
  {
    id: "seed-4",
    company: "Fernhill Games",
    role: "Gameplay Programmer Intern",
    location: "Victoria, BC",
    stage: "wishlist",
    createdAt: now - 864e5,
    description: `Gameplay Programmer Intern

Requirements
- C++ or C# proficiency
- Unity or Unreal experience
- Strong algorithms background

Nice to have
- Rust`,
  },
];
