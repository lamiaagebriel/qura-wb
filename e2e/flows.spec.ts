import { execSync } from "node:child_process";

import { expect, test } from "./fixtures";

// Every flow between people (reporting, moderating, requests, co-admins,
// erasing), run against the database by e2e/flows/flows.ts — the same
// functions the server actions call. No browser.
test("flows between users, place admins and the super admin", () => {
  test.setTimeout(240_000);
  let output: string;
  try {
    output = execSync("pnpm -s test:flows", { encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    const failed = error as { stdout?: string; stderr?: string };
    output = `${failed.stdout ?? ""}${failed.stderr ?? ""}`;
  }
  const failures = output.split("\n").filter((line) => line.startsWith("FAIL") || line.startsWith("CRASH"));
  expect(failures, output).toEqual([]);
  expect(output).toMatch(/\d+ passed, 0 failed/);
});
