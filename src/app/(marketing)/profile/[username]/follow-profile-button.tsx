"use client";

import { useState, useTransition } from "react";

import { useAuthPrompt } from "@/components/auth-prompt";
import { Button } from "@/components/ui/button";
import { followAction, unfollowAction } from "@/lib/auth/actions/follow";
import { handleAppError } from "@/lib/errors-client";
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
  ...buttonProps
}: {
  initialFollowerCount: number;
  followingCount: number;
  shareButton: React.ReactNode;
} & React.ComponentProps<typeof FollowProfileButton>) {
  const { t } = useLocale();
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);

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
        <FollowProfileButton
          {...buttonProps}
          onFollowChange={(following) =>
            setFollowerCount((c) => c + (following ? 1 : -1))
          }
        />
        {shareButton}
      </div>
    </>
  );
}
