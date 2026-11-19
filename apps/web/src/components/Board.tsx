"use client";

import { analyze } from "@waypoint/match-engine";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useWaypoint } from "@/lib/store";
import { STAGES, STAGE_LABEL, type Application, type Stage } from "@/lib/types";
import { JobDrawer } from "./JobDrawer";
import { ScoreRing } from "./ScoreRing";

function blank(): Application {
  return {
    id: crypto.randomUUID(),
    company: "",
    role: "",
    location: "",
    stage: "wishlist",
    description: "",
    createdAt: Date.now(),
  };
}

export function Board() {
  const { apps, resume, setResume, upsert, move, remove, reset, ready } = useWaypoint();
  const [open, setOpen] = useState<{ app: Application; isNew: boolean } | null>(null);
  const [showResume, setShowResume] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);

  const scored = useMemo(
    () => apps.map((a) => ({ app: a, score: analyze(resume, a.description).score })),
    [apps, resume],
  );

  const avg = scored.length ? Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length) : 0;

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display text-2xl">Waypoint</Link>
          <span className="hidden text-sm text-mute sm:inline">
            {apps.length} applications · avg match <span className="text-white">{avg}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowResume((v) => !v)} className="rounded-lg border border-line px-3 py-2 text-sm hover:bg-white/5">
            {showResume ? "Hide resume" : "Edit resume"}
          </button>
          <button onClick={() => setOpen({ app: blank(), isNew: true })} className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-slate-200">
            + Add job
          </button>
        </div>
      </header>

      {showResume && (
        <section className="rise card-sheen mb-8 rounded-xl border border-line p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Your resume</p>
            <button onClick={reset} className="text-xs text-mute hover:text-white">Reset demo data</button>
          </div>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            className="h-52 w-full resize-y rounded-lg border border-line bg-black/30 p-3 font-mono text-xs outline-none focus:border-glow/60"
            aria-label="Resume text"
          />
          <p className="mt-2 text-xs text-mute">Stored only in this browser. Every score below updates as you type.</p>
        </section>
      )}

      {!ready ? (
        <div className="h-96 animate-pulse rounded-xl border border-line bg-white/[0.02]" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {STAGES.map((stage) => {
            const items = scored.filter((x) => x.app.stage === stage).sort((a, b) => b.score - a.score);
            return (
              <section
                key={stage}
                onDragOver={(e) => { e.preventDefault(); setOverStage(stage); }}
                onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
                onDrop={() => { if (dragId) move(dragId, stage); setDragId(null); setOverStage(null); }}
                className={`min-h-48 rounded-xl border p-3 transition ${overStage === stage ? "border-glow/60 bg-glow/5" : "border-line bg-white/[0.015]"}`}
                aria-label={STAGE_LABEL[stage]}
              >
                <h3 className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-mute">
                  {STAGE_LABEL[stage]} <span className="tabular-nums">{items.length}</span>
                </h3>
                <div className="space-y-2.5">
                  {items.map(({ app, score }) => (
                    <button
                      key={app.id}
                      draggable
                      onDragStart={() => setDragId(app.id)}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      onClick={() => setOpen({ app, isNew: false })}
                      className="card-sheen rise flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left transition hover:-translate-y-0.5 hover:border-glow/40"
                    >
                      <ScoreRing value={score} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{app.company}</span>
                        <span className="block truncate text-xs text-mute">{app.role}</span>
                      </span>
                    </button>
                  ))}
                  {items.length === 0 && <p className="py-6 text-center text-xs text-mute/70">Drop a card here</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {open && (
        <JobDrawer
          app={open.app}
          isNew={open.isNew}
          resume={resume}
          onClose={() => setOpen(null)}
          onSave={(a) => { upsert(a); setOpen(null); }}
          onDelete={(id) => { remove(id); setOpen(null); }}
        />
      )}
    </main>
  );
}
