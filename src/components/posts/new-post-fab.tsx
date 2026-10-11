"use client";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { HugeiconsIcon, PlusSignIcon } from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { useLocale } from "@/lib/i18n/provider";
import { href } from "@/lib/routes";

const FAB =
  "pointer-events-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-foreground/20";

/**
 * The floating "New post" button, above the tab bar at the end edge of the
 * app column. Signed out, it opens the sign-in sheet instead.
 */
export function NewPostFab({ signedIn }: { signedIn: boolean }) {
  const { t } = useLocale();
  const { open: signIn } = useAuthSheet();
  const icon = (
    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2.5} className="size-6" />
  );

  return (
    // Tab bar: 4rem + the safe area; hidden with it while the keyboard is up.
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+var(--safe-bottom)+1rem)] z-30 mx-auto flex max-w-md justify-end px-4 in-data-[keyboard=open]:hidden">
      {signedIn ? (
        <StackLink
          href={href("newPost")}
          aria-label={t("New post")}
          className={FAB}
        >
          {icon}
        </StackLink>
      ) : (
        <button
          type="button"
          aria-label={t("New post")}
          onClick={() => signIn()}
          className={FAB}
        >
          {icon}
        </button>
      )}
    </div>
  );
}
