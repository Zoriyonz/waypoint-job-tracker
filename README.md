# Waypoint

**Know your odds before you apply.** Waypoint is a job-application tracker that scores your resume against every posting, shows exactly which skills are missing, and drafts a tailored cover letter. It runs entirely in the browser with no account and no API key. Add an Anthropic key and cover letters come from Claude instead.

## Features

- **Kanban board** with drag-and-drop stages: Wishlist, Applied, Interview, Offer, Closed
- **Live match score** that updates as you edit your resume or paste a job description
- **Transparent breakdown**: skills coverage, language relevance and quantified impact, with matched and missing skills
- **Required vs nice-to-have** detection from the posting's own section headings
- **Cover letters grounded in your resume**: the offline engine only mentions skills it actually found, and the Claude prompt forbids inventing facts
- **Local-first**: data lives in `localStorage`; a resume only leaves the browser if you request a hosted-model letter

## Architecture

```
waypoint/
├── apps/web                  Next.js 15 (App Router), React 19, Tailwind v4
└── packages/
    ├── match-engine          Pure TypeScript scoring engine (no dependencies)
    └── ai                    Provider abstraction: offline engine or Anthropic API
```

- `match-engine` is framework-free and fully unit tested. It extracts skills from a curated taxonomy, splits required from nice-to-have, computes cosine similarity with sublinear term frequency, and counts quantified achievements.
- `ai` defines an `AIProvider` interface. The Anthropic provider is used only when `ANTHROPIC_API_KEY` is set, and any failure degrades gracefully to the offline provider.
- `apps/web` calls the engine directly in the browser for instant scoring, and calls `/api/letter` only for letter generation, so the key never reaches the client.

### How the score works

`score = 100 × (0.60 × skills + 0.25 × relevance + 0.15 × impact)`

| Signal | What it measures |
| --- | --- |
| Skills | Required skills matched, with nice-to-haves at half weight |
| Relevance | Cosine similarity between resume and posting, rescaled |
| Impact | Count of quantified results (percentages, users, dollars) in the resume |

The weights are heuristics, not a prediction of hiring outcomes. Treat the score as a prompt to tailor your resume.

## Getting started

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # unit tests for both packages
pnpm typecheck
pnpm build
```

### Optional: Claude-written letters

```bash
cp apps/web/.env.example apps/web/.env.local
# then set ANTHROPIC_API_KEY in .env.local
```

## Roadmap

- Resume file upload (PDF) with parsing
- Sync across devices with a hosted database behind the same store interface
- Interview-prep checklist generated from missing skills

## License

MIT
