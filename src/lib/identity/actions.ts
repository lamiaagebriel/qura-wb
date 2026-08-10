"use server";

import { cookies } from "next/headers";

// Same cookie pattern as `lib/i18n/actions.ts`'s locale cookie — plain,
// unsigned, and never trusted on its own. It only ever names *which*
// identity you'd like active; `getActiveIdentity()` (in `./active.ts`)
// re-verifies ownership against the real session on every read, so a
// stale or tampered value just falls back to "you" instead of granting
// anything.
const ACTIVE_PROFILE_COOKIE = "qura__active_profile";

export async function setActiveProfile(id: string | null) {
  const jar = await cookies();
  if (!id) {
    jar.delete(ACTIVE_PROFILE_COOKIE);
    return;
  }
  jar.set(ACTIVE_PROFILE_COOKIE, id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function getActiveProfileCookie(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACTIVE_PROFILE_COOKIE)?.value ?? null;
}
