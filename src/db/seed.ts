/**
 * Sample data for local development: `pnpm db:seed`.
 * Keep it re-runnable (e.g. `.onConflictDoNothing()` on inserts).
 */
import { db } from "./index";

async function main() {
  // await db.insert(table).values([...]).onConflictDoNothing();
  console.log("Nothing to seed yet.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
