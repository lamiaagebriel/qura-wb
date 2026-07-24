import { NextRequest, NextResponse } from "next/server";

import { cleanupExpiredAuthRows } from "@/lib/db/cleanup";

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

  const result = await cleanupExpiredAuthRows();
  return NextResponse.json({ ok: true, ...result });
}
