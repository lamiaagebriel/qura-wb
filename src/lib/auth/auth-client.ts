"use client";

import { createAuthClient } from "better-auth/react";

// No `baseURL` — the client and the `/api/auth/*` routes are always
// same-origin here, which is Better Auth's default.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
