// Read-only sweep of the whole database for states that would store, show
// or count data wrongly. Each check is a query returning the broken rows
// (none = OK). `pnpm test:integrity`; exits 1 when a "high" check finds rows.
import postgres from "postgres";

try {
  process.loadEnvFile(".env");
} catch {
  // CI: from the environment.
}
const sql = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });

type Level = "high" | "medium" | "low";
type Check = { level: Level; name: string; query: () => Promise<postgres.Row[]> };

const checks: Check[] = [
  // ── References ─────────────────────────────────────────────────────
  {
    level: "high",
    // Answered ones keep pointing at what was deleted since (shown as "Gone").
    name: "waiting tickets pointing at records that don't exist",
    query: () => sql`
      select t.id, t.type, r->>'table' as tbl, r->>'id' as ref
      from tickets t, jsonb_array_elements(t.refs) r
      where t.status in ('open', 'escalated') and not case r->>'table'
        when 'posts' then exists (select 1 from posts where id::text = r->>'id')
        when 'businesses' then exists (select 1 from businesses where id::text = r->>'id')
        when 'places' then exists (select 1 from places where id::text = r->>'id')
        when 'users' then exists (select 1 from users where id::text = r->>'id')
        when 'business_reviews' then exists (select 1 from business_reviews where id::text = r->>'id')
        else false end`,
  },
  {
    level: "medium",
    name: "open tickets about things no longer public (deleted / suspended business, inactive person, hidden post / review)",
    query: () => sql`
      select t.id, t.type, t.status from tickets t
      where t.status in ('open', 'escalated') and (
        (t.refs->0->>'table' = 'businesses' and exists (select 1 from businesses b where b.id::text = t.refs->0->>'id' and b.status in ('deleted', 'suspended') and t.type <> 'reopen_business'))
        or (t.refs->0->>'table' = 'users' and exists (select 1 from users u where u.id::text = t.refs->0->>'id' and u.status <> 'active'))
        or (t.type = 'report_post' and exists (select 1 from posts p where p.id::text = t.refs->0->>'id' and p.status <> 'visible'))
        or (t.type = 'report_review' and exists (select 1 from business_reviews r where r.id::text = t.refs->0->>'id' and r.status <> 'visible')))`,
  },
  {
    level: "medium",
    name: "open tickets sent by people who are no longer active",
    query: () => sql`select t.id, t.type from tickets t join users u on u.id = t.created_by_id where t.status in ('open', 'escalated') and u.status <> 'active'`,
  },
  {
    level: "high",
    name: "waiting tickets without their duplicate key (two could open)",
    query: () => sql`select id, type from tickets where status in ('open', 'escalated') and open_key is null`,
  },
  // ── Statuses that contradict each other ────────────────────────────
  {
    level: "medium",
    name: "visible replies under a hidden / under-review post",
    query: () => sql`select r.id from posts r join posts p on p.id = r.parent_id where r.status = 'visible' and p.status <> 'visible'`,
  },
  {
    level: "high",
    name: "replies in another place or of another type than their post",
    query: () => sql`select r.id from posts r join posts p on p.id = r.parent_id where r.place_id <> p.place_id or r.type <> p.type`,
  },
  {
    level: "high",
    name: "replies to replies (only one level allowed)",
    query: () => sql`select r.id from posts r join posts p on p.id = r.parent_id where p.parent_id is not null`,
  },
  {
    level: "medium",
    name: "posts as a business their writer neither owns nor added",
    query: () => sql`select p.id from posts p join businesses b on b.id = p.business_id where p.parent_id is null and b.owner_id is distinct from p.created_by_id and b.created_by_id is distinct from p.created_by_id`,
  },
  {
    level: "medium",
    name: "offers / announcements not posted as a business",
    query: () => sql`select id, type from posts where parent_id is null and type in ('offer', 'announcement') and business_id is null`,
  },
  {
    level: "high",
    name: "live businesses with no branch (their page has no address or map)",
    query: () => sql`select b.username from businesses b where b.status = 'active' and not exists (select 1 from business_locations l where l.business_id = b.id)`,
  },
  {
    level: "medium",
    name: "live businesses without WhatsApp (no order button)",
    query: () => sql`select username from businesses where status = 'active' and not links @> '[{"platform":"whatsapp"}]'::jsonb`,
  },
  {
    level: "high",
    name: "opening hours that aren't 7 days",
    query: () => sql`select username, jsonb_array_length(hours) as days from businesses where jsonb_array_length(hours) not in (0, 7)`,
  },
  {
    level: "medium",
    name: "live businesses owned by someone suspended or deleted",
    query: () => sql`select b.username, u.status from businesses b join users u on u.id = b.owner_id where b.status = 'active' and u.status <> 'active'`,
  },
  {
    level: "medium",
    name: "place admins who are suspended or deleted",
    query: () => sql`select a.id, u.status from place_admins a join users u on u.id = a.user_id where u.status <> 'active'`,
  },
  {
    level: "high",
    name: "reviews of your own business",
    query: () => sql`select r.id from business_reviews r join businesses b on b.id = r.business_id where r.author_id in (b.owner_id, b.created_by_id)`,
  },
  {
    // The vote action refuses it (since 2026-10-19).
    level: "high",
    name: "votes on your own post",
    query: () => sql`select v.post_id from post_votes v join posts p on p.id = v.post_id where v.user_id = p.created_by_id`,
  },
  {
    level: "low",
    name: "votes / saves on posts the public can't see",
    query: () => sql`
      select 'vote' as kind, v.post_id from post_votes v join posts p on p.id = v.post_id where p.status <> 'visible'
      union all select 'save', s.post_id from post_saves s join posts p on p.id = s.post_id where p.status <> 'visible'`,
  },
  {
    level: "medium",
    name: "sign-in sessions of people who aren't active",
    query: () => sql`select s.user_id, u.status from sessions s join users u on u.id = s.user_id where u.status <> 'active' and s.expires_at > now()`,
  },
  // ── Duplicates ─────────────────────────────────────────────────────
  {
    level: "high",
    name: "two places with the same name under the same parent",
    query: () => sql`
      select coalesce(parent_id::text, 'top') as parent, lower(n) as name, count(*)::int
      from places, lateral (values (name->>'en'), (name->>'ar')) v(n) where n is not null
      group by 1, 2 having count(*) > 1`,
  },
  {
    level: "high",
    name: "@handles that differ only in case (users or businesses)",
    query: () => sql`
      select lower(username) as handle, count(*)::int from users group by 1 having count(*) > 1
      union all select lower(username), count(*)::int from businesses group by 1 having count(*) > 1`,
  },
  {
    level: "low",
    name: "a person's @username equal to a business's @handle",
    query: () => sql`select u.username from users u join businesses b on lower(b.username) = lower(u.username)`,
  },
  // ── Text ───────────────────────────────────────────────────────────
  {
    level: "medium",
    name: "{ en, ar } values holding an empty or blank language",
    query: () => sql`
      select 'place' as kind, slug as ref from places, jsonb_each_text(name) e where trim(e.value) = ''
      union all select 'kind', id::text from place_types, jsonb_each_text(name) e where trim(e.value) = ''
      union all select 'business name', username from businesses, jsonb_each_text(name) e where trim(e.value) = ''
      union all select 'business bio', username from businesses, jsonb_each_text(bio) e where trim(e.value) = ''
      union all select 'address', business_id::text from business_locations, jsonb_each_text(address) e where trim(e.value) = ''`,
  },
  {
    level: "low",
    name: "text with spaces at the start or end",
    query: () => sql`
      select 'user name' as kind, id::text as ref from users where name <> trim(name)
      union all select 'post', id::text from posts where body <> trim(body)
      union all select 'review', id::text from business_reviews where text <> trim(text)`,
  },
  {
    level: "high",
    name: "@handles with capitals or characters the forms don't allow",
    query: () => sql`
      select 'user' as kind, username from users where username !~ '^[a-z0-9._]{3,30}$' and username !~ '^deleted-[a-z0-9]+$'
      union all select 'business', username from businesses where username !~ '^[a-z0-9._]{3,30}$'`,
  },
  // ── History ────────────────────────────────────────────────────────
  {
    level: "medium",
    name: "changes made outside an action (no who / why), by source",
    query: () => sql`select source, table_name, count(*)::int from history where entry = 'change' and action_id is null group by 1, 2 order by 3 desc`,
  },
  {
    level: "high",
    name: "emails or secrets stored in history",
    query: () => sql`
      select id, entry, action, table_name from history
      where coalesce(input::text, '') ~* '"(email|token|password|access_?token|refresh_?token|id_?token)"'
         or coalesce(changes::text, '') ~* '"(email|token|password|access_token|refresh_token|id_token)"'
         or coalesce("row"::text, '') ~* '"(email|token|password|access_token|refresh_token|id_token)"'
         or coalesce(input::text, '') ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}'`,
  },
  {
    level: "high",
    name: "an erased person's old details still in history",
    query: () => sql`
      select h.id from history h join users u on u.id::text = h.record_id
      where h.table_name = 'users' and u.status = 'deleted' and u.name = 'Deleted account' and (h.changes is not null or h."row" is not null)
        and h.changes::text not like '%Deleted account%'`,
  },
];

void (async () => {
  let highs = 0;
  for (const check of checks) {
    try {
      const rows = await check.query();
      const ok = rows.length === 0;
      if (!ok && check.level === "high") highs++;
      console.log(`${ok ? "OK  " : check.level.toUpperCase().padEnd(6)}  ${check.name}${ok ? "" : `  (${rows.length})`}`);
      if (!ok) for (const row of rows.slice(0, 5)) console.log(`          ${JSON.stringify(row)}`);
    } catch (error) {
      highs++;
      console.log(`ERROR   ${check.name}: ${(error as Error).message}`);
    }
  }
  console.log(`\n${checks.length} checks, ${highs} high-risk findings`);
  process.exitCode = highs ? 1 : 0;
  await sql.end();
})();
