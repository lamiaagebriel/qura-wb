import type { OAuthProviderId } from "@/db/schema";

/**
 * Display-name lookup only — the actual OAuth clients (token exchange, user
 * info, redirect URIs) are owned entirely by Better Auth's `socialProviders`
 * config in `lib/auth/auth.ts` now. This just answers "what do we call this
 * provider in copy" (e.g. "This account uses Google sign-in") without
 * needing a live provider client to do it.
 */
const DISPLAY_NAMES: Record<OAuthProviderId, string> = {
  google: "Google",
};

export function getOAuthProviderDisplayName(id: string): string {
  return (
    DISPLAY_NAMES[id as OAuthProviderId] ??
    id.charAt(0).toUpperCase() + id.slice(1)
  );
}
