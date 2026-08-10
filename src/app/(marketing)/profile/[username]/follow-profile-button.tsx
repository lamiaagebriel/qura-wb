"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useAuthPrompt } from "@/components/auth-prompt";
import { Button } from "@/components/ui/button";
import { followAction, unfollowAction } from "@/lib/auth/actions/follow";
import { handleAppError } from "@/lib/errors-client";
import { setActiveProfile } from "@/lib/identity/actions";
import { useLocale } from "@/lib/i18n/client";

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
    <Button
      type="button"
      variant={isFollowing ? "outline" : "default"}
      className="flex-1"
      disabled={isPending}
      onClick={toggle}
    >
      {isFollowing ? t("Following") : t("Follow")}
    </Button>
  );
}

/** Follower count + follow button together — toggling follow needs to bump
 * this count in the same instant, and the count is server-rendered above
 * the button in markup but has to share state with it, so both live here
 * instead of the button updating a sibling it can't see. */
export function ProfileFollowStats({
  initialFollowerCount,
  followingCount,
  shareButton,
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
  shareButton: React.ReactNode;
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
        <span className="text-muted-foreground">
          <span className="text-foreground font-semibold">
            {followerCount}
          </span>{" "}
          {t("followers")}
        </span>
        <span className="text-muted-foreground">
          <span className="text-foreground font-semibold">
            {followingCount}
          </span>{" "}
          {t("following")}
        </span>
      </div>

      <div className="flex gap-2">
        {ownerBusinessId ? (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={isSwitching}
            onClick={editThisBusiness}
          >
            {t("Edit")}
          </Button>
        ) : (
          <FollowProfileButton
            {...buttonProps}
            onFollowChange={(following) =>
              setFollowerCount((c) => c + (following ? 1 : -1))
            }
          />
        )}
        {shareButton}
      </div>
    </>
  );
}
