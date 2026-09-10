"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { User } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthPrompt } from "@/components/auth-prompt";
import { useThreadComposer, type ComposerBusiness } from "@/components/new-thread-composer";
import { useLocale } from "@/lib/i18n/client";

/**
 * The feed's own "what's new?" row — first thing above the thread list,
 * same entry point as `NewThreadButton` in `BottomNav` (both ultimately
 * call `openCreate` on the one shared composer sheet), just styled as an
 * inviting compose row instead of a floating "+" — the way Threads' own
 * feed leads with a compose prompt rather than making you find a
 * separate button for it.
 */
export function FeedComposeTrigger({
  user,
  businesses = [],
  defaultPostAsId,
}: {
  user?: { username: string; name: string; image?: string | null } | null;
  businesses?: ComposerBusiness[];
  defaultPostAsId?: string;
}) {
  const { t } = useLocale();
  const { promptSignIn } = useAuthPrompt();
  const { openCreate } = useThreadComposer();

  function handleClick() {
    if (!user?.username) {
      promptSignIn();
      return;
    }
    openCreate(user, businesses, defaultPostAsId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="border-border/60 container flex items-center gap-3 border-b py-3 text-start"
    >
      <Avatar>
        {user?.image && <AvatarImage src={user.image} alt={user.name} />}
        <AvatarFallback>
          {user?.name ?? (
            <HugeiconsIcon
              icon={User}
              className="text-muted-foreground inline-block size-5"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          )}
        </AvatarFallback>
      </Avatar>
      <span className="text-muted-foreground flex-1 text-[14px]">
        {t("What's new?")}
      </span>
    </button>
  );
}
