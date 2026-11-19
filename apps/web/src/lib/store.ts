"use client";

import { useCallback, useEffect, useState } from "react";
import { SEED_APPS, SEED_RESUME } from "./seed";
import type { Application, Stage } from "./types";

const APPS_KEY = "waypoint.apps.v1";
const RESUME_KEY = "waypoint.resume.v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable (private mode); the app still works in memory */
  }
}

/**
 * Local-first persistence. All data stays in the browser, which keeps the demo
 * zero-config and means a resume never leaves the device unless the user asks
 * for a hosted-model cover letter.
 */
export function useWaypoint() {
  const [apps, setApps] = useState<Application[]>([]);
  const [resume, setResumeState] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setApps(read<Application[]>(APPS_KEY, SEED_APPS));
    setResumeState(read<string>(RESUME_KEY, SEED_RESUME));
    setReady(true);
  }, []);

  const commit = useCallback((next: Application[]) => {
    setApps(next);
    write(APPS_KEY, next);
  }, []);

  const setResume = useCallback((value: string) => {
    setResumeState(value);
    write(RESUME_KEY, value);
  }, []);

  const upsert = useCallback(
    (app: Application) => {
      const exists = apps.some((a) => a.id === app.id);
      commit(exists ? apps.map((a) => (a.id === app.id ? app : a)) : [app, ...apps]);
    },
    [apps, commit],
  );

  const move = useCallback(
    (id: string, stage: Stage) => commit(apps.map((a) => (a.id === id ? { ...a, stage } : a))),
    [apps, commit],
  );

  const remove = useCallback((id: string) => commit(apps.filter((a) => a.id !== id)), [apps, commit]);

  const reset = useCallback(() => {
    commit(SEED_APPS);
    setResume(SEED_RESUME);
  }, [commit, setResume]);

  return { apps, resume, setResume, upsert, move, remove, reset, ready };
}
