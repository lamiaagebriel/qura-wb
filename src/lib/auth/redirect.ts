import { href } from "@/lib/routes";

/**
 * Only same-site paths are allowed as a post-sign-in destination
 * (starts with "/", not "//" or "/\"), so `?next=` can't send users
 * to another site.
 */
export function safeNext(
  value: string | null | undefined,
  fallback = href("home"),
) {
  if (!value || !value.startsWith("/") || /^\/[/\\]/.test(value)) {
    return fallback;
  }
  return value;
}

/** `/login`, remembering where to go after (home is the default, so omitted). */
export function loginPath(next?: string, error?: string) {
  return href("login", {
    query: { next: next === href("home") ? undefined : next, error },
  });
}
