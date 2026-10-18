import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { TICKET_TYPE_KEYS, TICKET_TYPES } from "@/lib/tickets/types";

const typesOf = (kind: "request" | "report") =>
  sql.join(TICKET_TYPE_KEYS.filter((t) => TICKET_TYPES[t].kind === kind).map((t) => sql`${t}`), sql`, `);

/** Open (or sent-on) tickets of one kind. */
const openOf = (kind: "request" | "report") =>
  sql<number>`(select count(*) from tickets where status in ('open', 'escalated') and type in (${typesOf(kind)}))::int`;

export type Overview = {
  /** What waits for the admin. */
  pendingBusinesses: number;
  openRequests: number;
  openReports: number;
  /** Totals, and how many were added since the 1st of this month. */
  users: { total: number; thisMonth: number; suspended: number };
  businesses: { total: number; thisMonth: number; active: number };
  posts: { total: number; thisMonth: number };
};

/** The overview's numbers, in one round trip. */
export async function overview(): Promise<Overview> {
  const month = sql`date_trunc('month', now())`;
  const [row] = await db
    .select({
      pendingBusinesses: sql<number>`(select count(*) from businesses where status = 'pending')::int`,
      openRequests: openOf("request"),
      openReports: openOf("report"),
      // Deleted accounts and businesses aren't counted.
      usersTotal: sql<number>`(select count(*) from users where status <> 'deleted')::int`,
      usersMonth: sql<number>`(select count(*) from users where created_at >= ${month})::int`,
      usersSuspended: sql<number>`(select count(*) from users where status = 'suspended')::int`,
      businessesTotal: sql<number>`(select count(*) from businesses where status <> 'deleted')::int`,
      businessesMonth: sql<number>`(select count(*) from businesses where created_at >= ${month})::int`,
      businessesActive: sql<number>`(select count(*) from businesses where status = 'active')::int`,
      // Posts, not replies.
      postsTotal: sql<number>`(select count(*) from posts where parent_id is null)::int`,
      postsMonth: sql<number>`(select count(*) from posts where parent_id is null and created_at >= ${month})::int`,
    })
    .from(sql`(select 1) as one`);
  return {
    pendingBusinesses: row.pendingBusinesses,
    openRequests: row.openRequests,
    openReports: row.openReports,
    users: {
      total: row.usersTotal,
      thisMonth: row.usersMonth,
      suspended: row.usersSuspended,
    },
    businesses: {
      total: row.businessesTotal,
      thisMonth: row.businessesMonth,
      active: row.businessesActive,
    },
    posts: { total: row.postsTotal, thisMonth: row.postsMonth },
  };
}

export type Trend = { day: string; users: number; businesses: number; posts: number }[];

/** New users, businesses and posts per day, the last 30 days (the overview's trends). */
export async function trends(): Promise<Trend> {
  const rows = await db.execute<{ day: string; users: number; businesses: number; posts: number }>(sql`
    select to_char(d, 'YYYY-MM-DD') as day,
      (select count(*) from users u where u.created_at >= d and u.created_at < d + interval '1 day')::int as users,
      (select count(*) from businesses b where b.created_at >= d and b.created_at < d + interval '1 day')::int as businesses,
      (select count(*) from posts p where p.parent_id is null and p.created_at >= d and p.created_at < d + interval '1 day')::int as posts
    from generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') as d
    order by d`);
  return [...rows];
}
