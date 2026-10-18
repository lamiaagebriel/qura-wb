// Links into the dashboard's tables and records. Client-safe.

import { href } from "@/lib/routes";

/** A table (`?` filters it: `{ owner: "…" }`). */
export const tableHref = (resource: string, query?: Record<string, string>) =>
  href("adminTable", { params: { resource }, query });

/** A record's page. */
export const recordHref = (resource: string, id: string) =>
  href("adminRecord", { params: { resource, id } });
