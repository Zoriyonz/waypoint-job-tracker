# Waypoint

**Know your odds before you apply.** A job-application tracker that scores your resume against every posting, shows exactly which skills are missing, and drafts a tailored cover letter.

[![CI](https://github.com/Zoriyonz/waypoint-job-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/Zoriyonz/waypoint-job-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![Turborepo](https://img.shields.io/badge/Turborepo-monorepo-ef4444?logo=turborepo&logoColor=white)
![Node](https://img.shields.io/badge/node-%E2%89%A5%2020-339933?logo=nodedotjs&logoColor=white)
![Status](https://img.shields.io/badge/status-prototype-orange)

Waypoint runs entirely in the browser with no account and no API key. Add an Anthropic key and cover letters come from Claude instead of the built-in offline writer.

## Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [How the score works](#how-the-score-works)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Testing and quality gates](#testing-and-quality-gates)
- [Privacy and security](#privacy-and-security)
- [Design decisions](#design-decisions)
- [Limitations](#limitations)
- [Roadmap](#roadmap)
- [License](#license)

## Overview

Job searching generates a pile of postings and one resume. The useful question for each posting is "how well do I match, and what is missing?" Waypoint answers it with a transparent, deterministic scoring engine instead of a black box, and keeps your applications on a kanban board so you can see where each one stands.

## Features

- **Kanban board** with drag-and-drop stages: Wishlist, Applied, Interview, Offer, Closed.
- **Live match score** that updates as you edit your resume or paste a job description.
- **Transparent breakdown:** skills coverage, language relevance and quantified impact, with matched and missing skills listed.
- **Required versus nice-to-have detection** from the posting's own section headings.
- **Cover letters grounded in your resume.** The offline writer only mentions skills the engine actually found, and the Claude prompt is built to avoid inventing facts.
- **Local-first.** Data lives in `localStorage`. A resume only leaves the browser if you request a hosted-model letter.

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        UI[apps/web<br/>Next.js UI] -->|instant scoring| ME[packages/match-engine<br/>pure TypeScript]
        UI --> LS[(localStorage<br/>applications, resume)]
    end
    UI -->|letter request only| API[POST /api/letter]
    API --> AI[packages/ai<br/>provider abstraction]
    AI --> K{ANTHROPIC_API_KEY?}
    K -->|yes| H[Anthropic provider]
    K -->|no or failure| L[Local offline provider]
    L --> ME
```

```
waypoint/
├── apps/web                  Next.js 16 (App Router), React 19, Tailwind v4
└── packages/
    ├── match-engine          Pure TypeScript scoring engine (no dependencies)
    └── ai                    Provider abstraction: offline engine or Anthropic API
```

- **`match-engine`** is framework-free and fully unit tested. It extracts skills from a curated taxonomy, splits required from nice-to-have, computes cosine similarity with sublinear term frequency, and counts quantified achievements.
- **`ai`** defines an `AIProvider` interface. The Anthropic provider is used only when `ANTHROPIC_API_KEY` is set, and any failure degrades gracefully to the offline provider.
- **`apps/web`** calls the engine directly in the browser for instant scoring, and calls `/api/letter` only for letter generation, so the key never reaches the client.

## How the score works

`score = 100 × (0.60 × skills + 0.25 × relevance + 0.15 × impact)`

| Signal    | What it measures                                                        |
| --------- | ----------------------------------------------------------------------- |
| Skills    | Required skills matched, with nice-to-haves at half weight              |
| Relevance | Cosine similarity between resume and posting, rescaled                  |
| Impact    | Count of quantified results (percentages, users, dollars) in the resume |

Skills come from a curated taxonomy of about 58 canonical skills with aliases (for example `Node.js` also matches `nodejs`), matched on word boundaries so a skill never matches inside another word, and with symbols like `C++` and `C#` handled explicitly.

The weights are heuristics, not a prediction of hiring outcomes. Treat the score as a prompt to tailor your resume.

## Tech stack

| Area      | Choice                                                  |
| --------- | ------------------------------------------------------- |
| Framework | Next.js 16 (App Router), React 19                       |
| Language  | TypeScript 5 in strict mode                             |
| Styling   | Tailwind CSS 4                                          |
| Monorepo  | pnpm workspaces and Turborepo                           |
| AI        | Anthropic Messages API (optional), plain `fetch`        |
| Testing   | Vitest                                                  |
| Quality   | ESLint (`eslint-config-next`), Prettier, GitHub Actions |
| Packages  | pnpm 10, Node 20 or newer (`.nvmrc` pins 22)            |

## Project structure

```
waypoint-job-tracker/
├── apps/web/
│   └── src/
│       ├── app/                 Pages: / and /board, and POST /api/letter
│       ├── components/          Board, JobDrawer, ScoreRing
│       └── lib/                 store (local-first state), seed data, types
├── packages/
│   ├── match-engine/src/        analyze, skills taxonomy, text helpers (+ tests)
│   └── ai/src/                  providers: local and anthropic (+ tests)
├── .github/workflows/ci.yml     Format, lint, typecheck, test, build
├── turbo.json, pnpm-workspace.yaml, tsconfig.base.json
└── .editorconfig, .prettierrc.json, .nvmrc, LICENSE
```

## Getting started

Requires Node 20 or newer and [pnpm](https://pnpm.io) 10.

```bash
git clone https://github.com/Zoriyonz/waypoint-job-tracker.git
cd waypoint-job-tracker
pnpm install
pnpm dev                       # http://localhost:3000
```

The board opens with sample applications so you can try scoring immediately.

### Optional: Claude-written letters

```bash
cp apps/web/.env.example apps/web/.env.local
# then set ANTHROPIC_API_KEY in apps/web/.env.local
```

## Configuration

| Variable            | Required | Purpose                                                   |
| ------------------- | -------- | --------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | No       | Switches cover letters from the offline writer to Claude. |
| `ANTHROPIC_MODEL`   | No       | Overrides the default model.                              |

## Scripts

Run from the repository root.

| Command             | What it does                                   |
| ------------------- | ---------------------------------------------- |
| `pnpm dev`          | Start the web app                              |
| `pnpm build`        | Build everything through Turborepo             |
| `pnpm lint`         | ESLint                                         |
| `pnpm typecheck`    | `tsc --noEmit` in every package                |
| `pnpm test`         | Unit tests for both packages                   |
| `pnpm format`       | Format everything with Prettier                |
| `pnpm format:check` | Fail if anything is not formatted (used in CI) |

## Testing and quality gates

15 unit tests run offline. The match engine's 10 tests cover alias-based skill extraction, no matches inside other words, symbol skills like C++ and C#, required versus nice-to-have splitting, matched and missing skills, score bounds and ordering (a better resume scores higher), evidence suggestions for missing skills, neutral scoring when a posting names no skills, cosine similarity edge cases and quantified-achievement counting. The AI package's 5 tests cover provider selection, letters that only claim skills found in the resume, and fallback to the offline provider when the hosted API fails.

CI runs `format:check`, `lint`, `typecheck`, `test` and `build` on every push and pull request.

## Privacy and security

- Applications and the resume are stored only in your browser's `localStorage`.
- A resume is sent to the server only when you ask for a cover letter, and only to Anthropic if you configured a key.
- `/api/letter` rejects malformed JSON, requires non-empty `resume`, `jobDescription`, `company` and `role` strings, and caps each at 20,000 characters.
- The API key is read only on the server.

## Design decisions

- **A deterministic score you can read.** Every point comes from a named signal, so users can see why a posting scored the way it did.
- **Offline by default.** The local cover-letter provider makes the whole product work with zero configuration, and it only mentions skills it found in the resume.
- **A provider interface for AI.** Swapping or adding a model means implementing one interface, and failures fall back instead of surfacing errors.
- **A framework-free engine package.** `match-engine` imports nothing from React or Next.js.

## Limitations

- **The score is a heuristic.** It rewards keyword and phrase overlap and does not understand seniority, context or hiring practices.
- **The skills taxonomy is small and curated.** Skills outside it are not counted.
- **Data lives in one browser,** so clearing site data or switching devices loses it.
- **No rate limiting** on `/api/letter`. With a key configured, a public deployment would need one.
- **Resume input is pasted text,** not an uploaded file.

## Roadmap

- Resume file upload (PDF) with parsing
- Sync across devices with a hosted database behind the same store interface
- Interview-prep checklist generated from missing skills

## License

[MIT](LICENSE) © 2026 Zoriyon Zion
