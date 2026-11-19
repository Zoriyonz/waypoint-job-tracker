"use client";

import { analyze } from "@waypoint/match-engine";
import { useEffect, useMemo, useState } from "react";
import { STAGES, STAGE_LABEL, type Application, type Stage } from "@/lib/types";
import { ScoreRing } from "./ScoreRing";

interface Props {
  app: Application;
  resume: string;
  isNew: boolean;
  onSave: (app: Application) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const field =
  "w-full rounded-lg border border-line bg-black/30 px-3 py-2 text-sm outline-none transition focus:border-glow/60 focus:ring-2 focus:ring-glow/20";

function Chip({ children, tone }: { children: React.ReactNode; tone: "good" | "warn" }) {
  const cls =
    tone === "good"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : "border-amber-400/30 bg-amber-400/10 text-amber-200";
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs ${cls}`}>{children}</span>;
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-mute">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-glow transition-all duration-500"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

export function JobDrawer({ app, resume, isNew, onSave, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<Application>(app);
  const [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset the draft when a different application is opened (adjust state during render,
  // the pattern React recommends instead of syncing props to state in an effect).
  const [seenApp, setSeenApp] = useState<Application>(app);
  if (app !== seenApp) {
    setSeenApp(app);
    setDraft(app);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const result = useMemo(() => analyze(resume, draft.description), [resume, draft.description]);
  const set = <K extends keyof Application>(k: K, v: Application[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  async function writeLetter() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          resume,
          jobDescription: draft.description,
          company: draft.company,
          role: draft.role,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Request failed");
      const data = (await res.json()) as { letter: string; provider: string };
      set("letter", data.letter);
      setProvider(data.provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!draft.letter) return;
    await navigator.clipboard.writeText(draft.letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const canSave = draft.company.trim() && draft.role.trim();

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Application details"
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="rise relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-line bg-panel p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-mute">
              {isNew ? "New application" : "Application"}
            </p>
            <h2 className="font-display text-2xl">{draft.company || "Untitled"}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-mute hover:bg-white/5 hover:text-white"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        <div className="card-sheen mb-5 flex items-center gap-4 rounded-xl border border-line p-4">
          <ScoreRing value={result.score} size={72} stroke={6} />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="font-medium">{result.verdict}</p>
            <Bar label="Skills coverage" value={result.breakdown.skills} />
            <Bar label="Language relevance" value={result.breakdown.relevance} />
            <Bar label="Quantified impact" value={result.breakdown.impact} />
          </div>
        </div>

        <div className="mb-5 space-y-3">
          {(result.matchedRequired.length > 0 || result.matchedNice.length > 0) && (
            <div>
              <p className="mb-1.5 text-xs text-mute">You have</p>
              <div className="flex flex-wrap gap-1.5">
                {[...result.matchedRequired, ...result.matchedNice].map((s) => (
                  <Chip key={s} tone="good">
                    {s}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {(result.missingRequired.length > 0 || result.missingNice.length > 0) && (
            <div>
              <p className="mb-1.5 text-xs text-mute">Gaps</p>
              <div className="flex flex-wrap gap-1.5">
                {result.missingRequired.map((s) => (
                  <Chip key={s} tone="warn">
                    {s}
                  </Chip>
                ))}
                {result.missingNice.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-line px-2.5 py-0.5 text-xs text-mute"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          <ul className="space-y-1 text-sm text-mute">
            {result.suggestions.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-glow">→</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-mute">
              Company
              <input
                className={`${field} mt-1`}
                value={draft.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </label>
            <label className="text-xs text-mute">
              Role
              <input
                className={`${field} mt-1`}
                value={draft.role}
                onChange={(e) => set("role", e.target.value)}
              />
            </label>
            <label className="text-xs text-mute">
              Location
              <input
                className={`${field} mt-1`}
                value={draft.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </label>
            <label className="text-xs text-mute">
              Stage
              <select
                className={`${field} mt-1`}
                value={draft.stage}
                onChange={(e) => set("stage", e.target.value as Stage)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-xs text-mute">
            Job description (paste it in, the score updates live)
            <textarea
              className={`${field} mt-1 h-40 resize-y font-mono text-xs`}
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Cover letter</p>
            <button
              onClick={writeLetter}
              disabled={busy || !draft.description.trim() || !draft.company.trim()}
              className="rounded-lg bg-glow px-3 py-1.5 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-40"
            >
              {busy ? "Writing…" : draft.letter ? "Regenerate" : "Draft with AI"}
            </button>
          </div>
          {error && (
            <p className="mb-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
          {draft.letter && (
            <div className="card-sheen rounded-xl border border-line p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                {draft.letter}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-mute">
                <span>
                  {provider
                    ? `Written by ${provider === "anthropic" ? "Claude" : "the offline engine"}`
                    : "Saved draft"}
                </span>
                <button
                  onClick={copy}
                  className="rounded px-2 py-1 hover:bg-white/5 hover:text-white"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-8">
          {!isNew ? (
            <button
              onClick={() => onDelete(app.id)}
              className="text-sm text-red-300/80 hover:text-red-300"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={() => onSave(draft)}
            disabled={!canSave}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-slate-200 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </aside>
    </div>
  );
}
