import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { db, schema } from "@/db";

/**
 * Reserves a real thread id (and its S3 image-key ancestry, see
 * `threads.imagePath`'s own schema comment) BEFORE the thread row
 * exists — needed because images upload (and need their final key)
 * during compose, well before `createThreadAction`/`updateThreadAction`
 * ever runs. A top-level thread's path is just its own id; a reply's is
 * its parent's own path with its id appended, which is what makes a
 * later subtree delete a single S3 prefix instead of a DB walk.
 *
 * Only ONE extra read here (the parent's already-computed `imagePath`,
 * `NOT NULL` on every row) — never a walk up the parent chain, since
 * every thread's own path already has its full ancestry baked in the
 * moment it was reserved. `parent` coming back `undefined` only means a
 * bad/unknown `parentId`; the new path then just roots at that id
 * directly rather than failing outright.
 */
export async function reserveThreadImagePath(
  parentId?: string,
): Promise<{ id: string; imagePath: string }> {
  const id = randomUUID();
  if (!parentId) return { id, imagePath: id };

  const parent = await db.query.threads.findFirst({
    where: eq(schema.threads.id, parentId),
    columns: { imagePath: true },
  });
  return { id, imagePath: `${parent?.imagePath ?? parentId}/${id}` };
}

/** The already-reserved path for an EXISTING thread — read once when an
 * edit adds a new image, so that upload lands under the same prefix a
 * subtree delete would later target. */
export async function getThreadImagePath(
  threadId: string,
): Promise<string | null> {
  const row = await db.query.threads.findFirst({
    where: eq(schema.threads.id, threadId),
    columns: { imagePath: true },
  });
  return row?.imagePath ?? null;
}
