import "server-only";

import { cache } from "react";

import { getCurrentUser } from "@/lib/auth/guard";
import { getMyBusinessById, getMyBusinesses } from "@/lib/business/queries";

import { getActiveProfileCookie } from "./actions";

export type ActiveIdentity = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  bio: string | null;
  isBusiness: boolean;
  // The real signed-in account's id, always — regardless of which
  // identity is active. Actions a business can't do (follow, save,
  // vote, reply) act as this instead; see `followAction`/
  // `saveThreadAction`/`ComposeBox`, none of which ever take an
  // identity, only ever the session user.
  realUserId: string;
};

/**
 * Resolves "who the app currently looks like you are" — your own account
 * unless you've switched to a business profile (via `ProfileSwitcher`,
 * stored as a cookie). Memoized per request, same as `getCurrentSession`.
 *
 * The cookie is never trusted blindly: it only ever names an id, and this
 * re-checks that the *current* session actually owns a business with
 * that id on every call. A stale cookie (the business was deleted, or a
 * different account is now signed in on this browser) silently falls
 * back to the real account rather than erroring or leaking someone
 * else's business into your session.
 */
export const getActiveIdentity = cache(
  async (): Promise<ActiveIdentity | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const activeId = await getActiveProfileCookie();
    if (activeId && activeId !== user.id) {
      const business = await getMyBusinessById(activeId, user.id);
      if (business) {
        return {
          id: business.id,
          name: business.name,
          username: business.username,
          image: business.image,
          bio: business.bio,
          isBusiness: true,
          realUserId: user.id,
        };
      }
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image ?? null,
      bio: user.bio ?? null,
      isBusiness: false,
      realUserId: user.id,
    };
  },
);

/** Every identity the switcher can offer: your own account first, then
 * each business you own. */
export const getSwitchableIdentities = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return [];

  const businesses = await getMyBusinesses(user.id);
  return [
    {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image ?? null,
      isBusiness: false,
    },
    ...businesses.map((b) => ({
      id: b.id,
      name: b.name,
      username: b.username,
      image: b.image,
      isBusiness: true,
    })),
  ];
});
