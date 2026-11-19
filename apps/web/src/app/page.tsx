import Link from "next/link";
import { ScoreRing } from "@/components/ScoreRing";

const features = [
  {
    title: "Honest match scores",
    body: "Every job is scored against your resume on skills coverage, language relevance and quantified impact. No black box, you see the breakdown.",
  },
  {
    title: "Gaps, not guesses",
    body: "See exactly which required skills your resume doesn't show yet, with concrete ways to fix each one.",
  },
  {
    title: "Letters that don't lie",
    body: "Cover letters are grounded in skills actually found in your resume, whether drafted offline or by Claude.",
  },
];

const demo = [
  { company: "Northwind Labs", role: "Frontend Intern", score: 78 },
  { company: "Orbital Pay", role: "Backend Co-op", score: 64 },
  { company: "Cedar AI", role: "ML Intern", score: 33 },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6">
      <nav className="flex items-center justify-between py-6">
        <span className="font-display text-2xl">Waypoint</span>
        <Link
          href="/board"
          className="rounded-full border border-line px-4 py-2 text-sm hover:bg-white/5"
        >
          Open the board
        </Link>
      </nav>

      <section className="grid items-center gap-12 py-20 lg:grid-cols-[1.2fr_1fr]">
        <div className="rise">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-mute">Application tracker</p>
          <h1 className="font-display text-5xl leading-[1.05] sm:text-6xl">
            <span className="text-gradient">Know your odds</span>
            <br />
            before you apply.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-mute">
            Paste a job description and Waypoint scores it against your resume, shows what&apos;s
            missing, and drafts a tailored cover letter. Everything runs in your browser, no
            account, no API key.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/board"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black hover:bg-slate-200"
            >
              Try the live demo
            </Link>
            <a
              href="https://github.com/Zoriyonz/waypoint-job-tracker"
              className="rounded-full border border-line px-6 py-3 text-sm hover:bg-white/5"
            >
              View source
            </a>
          </div>
        </div>

        <div className="rise card-sheen rounded-2xl border border-line p-5" aria-hidden="true">
          <p className="mb-4 text-xs uppercase tracking-widest text-mute">This week</p>
          <div className="space-y-3">
            {demo.map((d) => (
              <div
                key={d.company}
                className="flex items-center gap-4 rounded-xl border border-line bg-black/20 p-3"
              >
                <ScoreRing value={d.score} size={52} />
                <div>
                  <p className="text-sm font-medium">{d.company}</p>
                  <p className="text-xs text-mute">{d.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-24 md:grid-cols-3">
        {features.map((f) => (
          <article key={f.title} className="card-sheen rounded-2xl border border-line p-6">
            <h2 className="font-display text-xl">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">{f.body}</p>
          </article>
        ))}
      </section>

      <footer className="border-t border-line py-8 text-sm text-mute">
        Built with Next.js, TypeScript, Tailwind and a tested matching engine in a Turborepo
        monorepo.
      </footer>
    </main>
  );
}
