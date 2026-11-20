// Who the stood-in session returns (src/test/setup.ts). Imports nothing, so
// the mocks can load it.

export type TestUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  status: string;
  image: string | null;
  bio: string | null;
};

export const session = { user: null as TestUser | null };

/** The request's cookies (the picked place, the language). */
export const cookieJar = new Map<string, string>();
