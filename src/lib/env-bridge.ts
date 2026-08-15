/**
 * Server-side environment bridge.
 *
 * Some hosts (e.g. Vercel via the GitHub sync) only have the browser-facing
 * `VITE_SUPABASE_*` variables configured. The server runtime reads the
 * unprefixed `SUPABASE_*` names, which then look "missing".
 *
 * This module mirrors the VITE_ values onto `process.env` (build-time inlined
 * values first, runtime values second) before anything else loads.
 */
const PAIRS: Array<[target: string, value: string | undefined]> = [
  [
    "SUPABASE_URL",
    import.meta.env?.VITE_SUPABASE_URL ?? process.env?.["VITE_SUPABASE_URL"],
  ],
  [
    "SUPABASE_PUBLISHABLE_KEY",
    import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
      process.env?.["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
      import.meta.env?.VITE_SUPABASE_ANON_KEY ??
      process.env?.["VITE_SUPABASE_ANON_KEY"],
  ],
  [
    "SUPABASE_PROJECT_ID",
    import.meta.env?.VITE_SUPABASE_PROJECT_ID ?? process.env?.["VITE_SUPABASE_PROJECT_ID"],
  ],
];

try {
  if (typeof process !== "undefined" && process.env) {
    for (const [key, value] of PAIRS) {
      if (!process.env[key] && value) process.env[key] = value;
    }
  }
} catch {
  // read-only env in some runtimes — nothing else we can do here
}

export {};
