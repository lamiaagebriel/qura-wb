// One file per domain (e.g. `users.ts`, `threads.ts`), each re-exported here.
// Both the db client and drizzle-kit read the schema from this folder.
export * from "./users";
export * from "./auth";
export * from "./profiles";
