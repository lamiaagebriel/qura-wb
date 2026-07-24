import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/auth";

// Handles every Better Auth endpoint — sign-in/up, sign-out, social OAuth
// redirects + callbacks, email verification, password reset, session
// lookup. Replaces the old hand-rolled `/api/auth/[provider]` +
// `/api/auth/[provider]/callback` routes entirely.
export const { GET, POST } = toNextJsHandler(auth);
