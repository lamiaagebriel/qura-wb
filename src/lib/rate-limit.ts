import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { rateLimits } from "@/db/schema";

/**
 * Counts one attempt at `key` and says whether it's allowed: at most `max`
 * per `windowSeconds`. Counters live in `rate_limits` (shared with Better
 * Auth, so keys are prefixed `app:`), so the limit holds across serverless
 * instances. One atomic upsert, safe under concurrent requests.
 *
 *   if (!(await rateLimit(`follow:${userId}`, 60, 60))) return tooMany;
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;
  const expired = sql`${rateLimits.lastRequest} < ${windowStart}`;
  const [row] = await db
    .insert(rateLimits)
    .values({ key: `app:${key}`, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        // A new window starts after the old one ran out.
        count: sql`case when ${expired} then 1 else ${rateLimits.count} + 1 end`,
        lastRequest: sql`case when ${expired} then ${now} else ${rateLimits.lastRequest} end`,
      },
    })
    .returning({ count: rateLimits.count });
  return row.count <= max;
}
