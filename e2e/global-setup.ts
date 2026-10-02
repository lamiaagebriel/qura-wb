import { execSync } from "node:child_process";

import { SEED_BUSINESSES } from "../src/db/seed/businesses";

import { db, EMAIL } from "./auth";

/**
 * Before every run: the sample businesses back to their seeded state, and
 * nothing left over from earlier runs (businesses the test user added,
 * their follows and reviews, their avatar and bio). Other data in the dev
 * database is untouched.
 */
export default async function globalSetup() {
  const sql = db();
  const handles = SEED_BUSINESSES.map((b) => b.username);
  await sql`
    delete from businesses
    where username in ${sql(handles)}
      or created_by_id = (select id from users where email = ${EMAIL})`;
  await sql`delete from follows where user_id = (select id from users where email = ${EMAIL})`;
  await sql`delete from reviews where author_id = (select id from users where email = ${EMAIL})`;
  await sql`update users set image = null, bio = null where email = ${EMAIL}`;
  await sql.end();
  execSync("pnpm db:seed", { stdio: "inherit" });
}
