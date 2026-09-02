/**
 * The entire observability layer, deliberately — this repo has no
 * metrics/APM dependency (Sentry, Datadog, ...) anywhere in
 * `package.json`, and Phase 14 doesn't introduce one. The deployment
 * target (Vercel, per `db/index.ts`'s own comments) already captures
 * stdout/stderr as queryable logs, so a consistently-shaped
 * `console.log`/`console.warn` line IS a real, working observability
 * layer here — not a placeholder for a "real" one.
 *
 * Every call site already existed as an ad-hoc `console.warn` with a
 * `[module-name]` prefix (Phase 3 onward); this only standardizes the
 * *shape* of the line so it's greppable/filterable by `event`, not the
 * mechanism.
 *
 * NEVER pass: an API key, a raw Google response body, a database
 * connection string, or anything else that isn't already one of this
 * function's typed fields. `fields` is intentionally a flat, small,
 * known set — not an open `Record<string, unknown>` bag a future call
 * site could accidentally stuff a secret into.
 */
export type LogFields = {
  placeId?: string;
  category?: string;
  city?: string;
  query?: string;
  status?: string;
  reason?: string;
  durationMs?: number;
  count?: number;
};

function format(event: string, fields?: LogFields): string {
  const parts = [`event=${event}`];
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) parts.push(`${key}=${value}`);
    }
  }
  return parts.join(" ");
}

/** A normal, expected event worth keeping (cache hit/miss, a page's
 * latency breakdown, a stampede-guard claim/skip) — not an error. */
export function logEvent(event: string, fields?: LogFields): void {
  console.log(format(event, fields));
}

/** A degraded-but-handled condition (Google returned 4xx/5xx, a request
 * timed out) — still not surfaced to the user, but worth standing out
 * from `logEvent` in log output. */
export function logWarning(event: string, fields?: LogFields): void {
  console.warn(format(event, fields));
}

/** Measures one async operation and logs its duration alongside
 * whatever `fields` describe it — the one helper every latency
 * measurement in this phase goes through, so the shape stays consistent
 * without every call site hand-rolling `Date.now()` deltas. */
export async function withTiming<T>(
  event: string,
  fields: LogFields,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    logEvent(event, { ...fields, durationMs: Date.now() - start });
  }
}
