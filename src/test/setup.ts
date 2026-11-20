import { vi } from "vitest";

import { cookieJar, session } from "./session";

// Only what needs a real request is stood in; every action, query, rule and
// database trigger is the real one.

// Sign-in: `session.user` (set it with `signIn` from ./helpers).
vi.mock("@/lib/auth/session", () => {
  const current = async () =>
    session.user
      ? {
          user: { ...session.user, emailVerified: true, createdAt: new Date(), updatedAt: new Date() },
          session: { id: "test", userId: session.user.id, token: "test", expiresAt: new Date(Date.now() + 86_400_000) },
        }
      : null;
  return {
    getSession: current,
    getFreshSession: current,
    requireUser: async () => {
      if (!session.user) throw new Error("requireUser: signed out");
      return (await current())!.user;
    },
  };
});

// Next's caches and revalidation only exist inside a request.
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  revalidatePath: () => {},
  revalidateTag: () => {},
  updateTag: () => {},
  refresh: () => {},
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
}));
