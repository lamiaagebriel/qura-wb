/* eslint-disable @typescript-eslint/no-require-imports -- loaded with `node --require`: must be CommonJS */
// The flows run outside a Next.js request, where `next/cache` (revalidating
// pages) has nothing to do: point it at no-ops. Loaded with `--require`.
const Module = require("node:module");

const stub = { revalidatePath() {}, revalidateTag() {}, updateTag() {}, unstable_cache: (fn) => fn };
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "next/cache" || request === "next/cache.js") return "next-cache-stub";
  return resolve.call(this, request, ...rest);
};
require.cache["next-cache-stub"] = { id: "next-cache-stub", filename: "next-cache-stub", loaded: true, exports: stub };
