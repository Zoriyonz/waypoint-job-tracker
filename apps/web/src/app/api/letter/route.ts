import { generateCoverLetter } from "@waypoint/ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX = 20_000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const fields = ["resume", "jobDescription", "company", "role"] as const;
  for (const f of fields) {
    if (typeof b[f] !== "string" || !(b[f] as string).trim()) {
      return NextResponse.json({ error: `Missing ${f}` }, { status: 400 });
    }
    if ((b[f] as string).length > MAX) {
      return NextResponse.json({ error: `${f} is too long` }, { status: 413 });
    }
  }

  const result = await generateCoverLetter(
    {
      resume: b.resume as string,
      jobDescription: b.jobDescription as string,
      company: b.company as string,
      role: b.role as string,
    },
    process.env,
  );
  return NextResponse.json(result);
}
