import "server-only";

import { getFreshSession } from "@/lib/auth/session";
import type { MessageKey } from "@/lib/i18n/types";
import { rateLimit } from "@/lib/rate-limit";
import type { Actor } from "@/lib/tickets/server";

/**
 * Who's acting, for a server action: the fresh session's active user
 * within the hourly limit for `limitKey` — or the error to show. Actions
 * are public endpoints; every one starts here.
 */
export async function currentActor(
  limitKey: string,
  max: number,
): Promise<{ actor: Actor } | { error: MessageKey }> {
  const session = await getFreshSession();
  if (!session || session.user.status !== "active") return { error: "Please sign in again." };
  if (!(await rateLimit(`${limitKey}:${session.user.id}`, max, 60 * 60))) {
    return { error: "Too many attempts. Please wait a moment." };
  }
  const { id, role, status } = session.user;
  return { actor: { id, role: role ?? "member", status: status ?? "active" } };
}
