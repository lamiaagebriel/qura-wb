"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon, UserAdd01Icon, UserCheck01Icon } from "@hugeicons/core-free-icons";

import { useAuthPrompt } from "@/components/auth-prompt";
import { followAction, unfollowAction } from "@/lib/auth/actions/follow";
import { handleAppError } from "@/lib/errors-client";
import { setActiveProfile } from "@/lib/identity/actions";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

// Same vertical icon-over-label tile as Directions/Call/Website
// (`profile/[username]/page.tsx`'s action row) — Follow sits beside
// them as one more tile in that row, not a visually separate button
// with its own shape. Filled with the brand color while unfollowed (the
// one real call-to-action in the row) and drops to the same muted tile
// as Call/Website once following, the same "primary vs. secondary
// action" hierarchy Directions/the rest already use.
export function FollowProfileButton({
  userId,
  initialIsFollowing,
  isSignedIn,
  onFollowChange,
}: {
  userId: string;
  initialIsFollowing: boolean;
  isSignedIn: boolean;
  onFollowChange?: (following: boolean) => void;
}) {
  const { t } = useLocale();
  const { promptSignIn } = useAuthPrompt();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (!isSignedIn) {
      promptSignIn();
      return;
    }
    const next = !isFollowing;
    setIsFollowing(next);
    onFollowChange?.(next);
    startTransition(async () => {
      const result = next
        ? await followAction(userId)
        : await unfollowAction(userId);
      if (!result.success) {
        setIsFollowing(!next);
        onFollowChange?.(!next);
        handleAppError(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={toggle}
      className={cn(
        "flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5 disabled:opacity-50",
        isFollowing ? "bg-muted text-foreground" : "bg-primary text-primary-foreground",
      )}
    >
      <HugeiconsIcon
        icon={isFollowing ? UserCheck01Icon : UserAdd01Icon}
        className="size-4.5"
      />
      <span className="text-[10.5px] font-semibold">
        {isFollowing ? t("Following") : t("Follow")}
      </span>
    </button>
  );
}

/** Follower count + follow button together — toggling follow needs to bump
 * this count in the same instant, and the count is server-rendered above
 * the button in markup but has to share state with it, so both live here
 * instead of the button updating a sibling it can't see.
 *
 * `actionTiles` is the (server-rendered, static) Directions/Call/Website
 * row from `page.tsx` — passed in as children rather than rendered by
 * the caller alongside this component, so Follow/Edit can sit as the
 * FIRST tile in that exact same row instead of its own separate button
 * above it. */
export function ProfileFollowStats({
  initialFollowerCount,
  followingCount,
  isBusiness,
  actionTiles,
  // Set only when this profile is a business the viewer owns — you can't
  // follow your own business (see `followAction`'s matching check), so
  // this slot gets an "Edit" button instead of `FollowProfileButton`,
  // the same way `/account` swaps Follow for Edit/Settings on your own
  // personal profile. `/account/business` (the one edit/create page for
  // businesses) always acts on whichever identity is *active* — not
  // necessarily this one, if you own more than one — so editing from
  // here has to switch to this business first, then go there.
  ownerBusinessId,
  ...buttonProps
}: {
  initialFollowerCount: number;
  followingCount: number;
  isBusiness: boolean;
  actionTiles?: React.ReactNode;
  ownerBusinessId?: string;
} & React.ComponentProps<typeof FollowProfileButton>) {
  const { t } = useLocale();
  const router = useRouter();
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isSwitching, setIsSwitching] = useState(false);

  async function editThisBusiness() {
    if (!ownerBusinessId) return;
    setIsSwitching(true);
    await setActiveProfile(ownerBusinessId);
    router.push("/account/business");
  }

  return (
    <>
      <div className="flex items-center gap-4 text-[13px]">
        {isBusiness ? (
          <span className="text-muted-foreground">
            <span className="text-foreground font-semibold">
              {followerCount}
            </span>{" "}
            {t("followers")}
          </span>
        ) : (
          <span className="text-muted-foreground">
            <span className="text-foreground font-semibold">
              {followingCount}
            </span>{" "}
            {t("following")}
          </span>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        {ownerBusinessId ? (
          <button
            type="button"
            disabled={isSwitching}
            onClick={editThisBusiness}
            className="bg-muted text-foreground flex flex-1 flex-col items-center gap-1.5 rounded-xl py-2.5 disabled:opacity-50"
          >
            <HugeiconsIcon icon={Edit02Icon} className="size-4.5" />
            <span className="text-[10.5px] font-semibold">{t("Edit")}</span>
          </button>
        ) : (
          <FollowProfileButton
            {...buttonProps}
            onFollowChange={(following) =>
              setFollowerCount((c) => c + (following ? 1 : -1))
            }
          />
        )}
        {actionTiles}
      </div>
    </>
  );
}
