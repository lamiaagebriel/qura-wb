import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { accounts } from "@/db/schema";

/**
 * The user's Google profile photo, read from the ID token Better Auth kept
 * at sign-in — so it can be offered again after they picked another
 * avatar. `null` if there's none.
 */
export async function getGooglePhoto(userId: string): Promise<string | null> {
  const [account] = await db
    .select({ idToken: accounts.idToken })
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google")))
    .orderBy(desc(accounts.updatedAt))
    .limit(1);
  const payload = account?.idToken?.split(".")[1];
  if (!payload) return null;
  try {
    const { picture } = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { picture?: unknown };
    return typeof picture === "string" && picture.startsWith("https://")
      ? picture
      : null;
  } catch {
    return null;
  }
}
