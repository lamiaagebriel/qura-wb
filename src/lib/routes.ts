/**
 * Every app path, in one place. Build links with `href()` instead of
 * writing paths by hand:
 *
 *   href("home")                                      // "/"
 *   href("login", { query: { next: "/profile" } })    // "/login?next=%2Fprofile"
 *
 * Dynamic segments use `:name`, and `href` requires exactly those params:
 *
 *   profile: "/profile/:username"
 *   href("profile", { params: { username: "omar" } }) // "/profile/omar"
 */
export const routes = {
  home: "/",
  search: "/search",
  profile: "/profile",
  settings: "/profile/settings",
  offline: "/offline",
  login: "/login",
} as const;

export type RouteName = keyof typeof routes;

// "/a/:id/b/:slug" → "id" | "slug"
type ParamKeys<Path extends string> =
  Path extends `${string}:${infer Key}/${infer Rest}`
    ? Key | ParamKeys<`/${Rest}`>
    : Path extends `${string}:${infer Key}`
      ? Key
      : never;

type Query = Record<string, string | number | null | undefined>;

type HrefOptions<Path extends string> = { query?: Query } & ([
  ParamKeys<Path>,
] extends [never]
  ? { params?: never }
  : { params: Record<ParamKeys<Path>, string | number> });

// Options are optional only for routes without params.
type HrefArgs<Path extends string> = [ParamKeys<Path>] extends [never]
  ? [options?: HrefOptions<Path>]
  : [options: HrefOptions<Path>];

export function href<Name extends RouteName>(
  name: Name,
  ...[options]: HrefArgs<(typeof routes)[Name]>
): string {
  const params: Record<string, string | number> = options?.params ?? {};

  const path = routes[name].replace(/:(\w+)/g, (_, key: string) =>
    encodeURIComponent(String(params[key])),
  );

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(options?.query ?? {})) {
    // Skip empty values so links stay clean.
    if (value != null && value !== "") search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}
