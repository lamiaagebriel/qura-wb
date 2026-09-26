"use client";

import { createAuthClient } from "better-auth/react";

// Same origin as `/api/auth/*`, so no `baseURL` is needed.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
