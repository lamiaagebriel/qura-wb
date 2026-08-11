"use client";

import { useState, useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { followAction, unfollowAction } from "@/lib/auth/actions/follow";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";

type ListUser = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  isFollowedByMe: boolean;
};

function FollowButton({ user }: { user: ListUser }) {
  const { t } = useLocale();
  const [isFollowing, setIsFollowing] = useState(user.isFollowedByMe);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !isFollowing;
    setIsFollowing(next);
    startTransition(async () => {
      const result = next
        ? await followAction(user.id)
        : await unfollowAction(user.id);
      if (!result.success) {
        setIsFollowing(!next);
        handleAppError(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={isFollowing ? "outline" : "default"}
      disabled={isPending}
      onClick={toggle}
    >
      {isFollowing ? t("Following") : t("Follow")}
    </Button>
  );
}

export function FollowList({
  users,
  emptyLabel,
}: {
  users: ListUser[];
  emptyLabel: string;
}) {
  if (users.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center text-[13px]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="divide-border/60 flex flex-col divide-y">
      {users.map((user) => (
        <li key={user.id} className="flex items-center gap-3 py-3">
          <Avatar>
            <AvatarImage src={user.image!} alt={user.name} />
            <AvatarFallback>{user.name}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col leading-tight">
            <span className="text-foreground text-[13.5px] font-medium">
              {user.name}
            </span>
            <span dir="ltr" className="text-muted-foreground text-xs">
              @{user.username}
            </span>
          </div>
          <FollowButton user={user} />
        </li>
      ))}
    </ul>
  );
}
