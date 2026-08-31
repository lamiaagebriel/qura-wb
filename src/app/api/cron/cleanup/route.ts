import { NextRequest, NextResponse } from "next/server";

import { cleanupExpiredAuthRows } from "@/lib/db/cleanup";
import { sweepOrphanedThreadImages } from "@/lib/storage/cleanup";

// Vercel Cron calls this on the schedule in `vercel.json`, sending
// `Authorization: Bearer ${CRON_SECRET}` automatically as long as
// `CRON_SECRET` is set in the project's env vars — this just checks that
// header matches, so the endpoint can't be triggered by anyone who finds
// the URL. See https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // `sweepOrphanedThreadImages` no-ops (returns zeros) if image storage
  // isn't configured yet — safe to always run alongside the auth-row
  // sweep rather than needing its own separate cron entry.
  const [authRows, threadImages] = await Promise.all([
    cleanupExpiredAuthRows(),
    sweepOrphanedThreadImages(),
  ]);
  return NextResponse.json({ ok: true, ...authRows, threadImages });
}
