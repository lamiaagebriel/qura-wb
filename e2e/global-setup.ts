import { execSync } from "node:child_process";

import { SEED_BUSINESSES } from "../src/db/seed/businesses";

import { db, EMAIL } from "./auth";

/**
 * Before every run: the sample businesses back to their seeded state, and
 * nothing left over from earlier runs (businesses the test user added,
 * their follows, reviews and posts, their avatar and bio). Other data in the dev
 * database is untouched.
 */
export default async function globalSetup() {
  const sql = db();
  const handles = SEED_BUSINESSES.map((b) => b.username);
  await sql`
    delete from businesses
    where username in ${sql(handles)}
      or created_by_id = (select id from users where email = ${EMAIL})`;
  await sql`delete from business_follows where user_id = (select id from users where email = ${EMAIL})`;
  await sql`delete from business_reviews where author_id = (select id from users where email = ${EMAIL})`;
  // Posts / replies they wrote (their businesses' went with the businesses),
  // their votes and bookmarks.
  await sql`delete from posts where created_by_id = (select id from users where email = ${EMAIL})`;
  await sql`delete from post_votes where user_id = (select id from users where email = ${EMAIL})`;
  await sql`delete from post_saves where user_id = (select id from users where email = ${EMAIL})`;
  await sql`update users set image = null, bio = null where email = ${EMAIL}`;

  // Places: what the test accounts asked for, reported or administer, and
  // every place the tests created ("E2E …", slug `e2e-…`) with its posts.
  const testers = sql`(select id from users where email like 'e2e%@qura.test')`;
  // Their tickets (requests and reports), sent by them or about them.
  await sql`delete from tickets where created_by_id in ${testers}`;
  await sql`
    delete from tickets t where exists (
      select 1 from jsonb_array_elements(t.refs) r
      where r->>'table' = 'users' and (r->>'id')::uuid in ${testers})`;
  await sql`delete from place_admins where user_id in ${testers}`;
  // Their hourly action limits start fresh, so back-to-back runs don't hit
  // them (keys end with the user's id).
  await sql`
    delete from rate_limits r using users u
    where (u.email like 'e2e%@qura.test') and r.key like '%:' || u.id::text`;
  await sql`
    delete from posts where created_by_id in ${testers}
      or place_id in (select id from places where slug like 'e2e-%')`;
  // Inside-out: a place can't go while places are still inside it.
  for (let i = 0; i < 10; i++) {
    const gone = await sql`
      delete from places where slug like 'e2e-%'
        and id not in (select parent_id from places where parent_id is not null)`;
    if (!gone.count) break;
  }
  await sql`delete from place_types where name->>'en' like 'E2E%'`;
  await sql.end();
  execSync("pnpm db:seed", { stdio: "inherit" });
}
