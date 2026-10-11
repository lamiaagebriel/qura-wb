"use client";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { HugeiconsIcon, PlusSignIcon } from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";
import type { PostType } from "@/lib/posts";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

/**
 * A + in the header that opens "New post" (on `type`, when given) —
 * signed out, the sign-in sheet instead.
 */
export function NewPostButton({
  signedIn,
  type,
}: {
  signedIn: boolean;
  type?: PostType;
}) {
  const { t } = useLocale();
  const { open: signIn } = useAuthSheet();
  const className = cn(
    buttonVariants({ variant: "ghost" }),
    "size-11 rounded-full",
  );
  const icon = (
    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-5" />
  );

  return signedIn ? (
    <StackLink
      href={href("newPost", { query: { type } })}
      aria-label={t("New post")}
      className={className}
    >
      {icon}
    </StackLink>
  ) : (
    <button
      type="button"
      aria-label={t("New post")}
      onClick={() => signIn()}
      className={className}
    >
      {icon}
    </button>
  );
}
