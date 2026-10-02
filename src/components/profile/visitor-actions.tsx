"use client";

import { useOptimistic, useTransition } from "react";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import {
  HugeiconsIcon,
  Share08Icon,
  Tick02Icon,
  UserAdd01Icon,
  WhatsappIcon,
} from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import { href } from "@/lib/routes";
import { useShare } from "@/lib/share";
import { withMessage, type WhatsappLink } from "@/lib/socials";
import { cn } from "@/lib/utils";

import { setFollowing } from "./social-actions";

/**
 * A visitor's buttons under a business profile: follow, and order on
 * WhatsApp (every business has it) with a message ready to send.
 * Sharing lives in the top bar (`ShareProfileButton`).
 * Follow flips at once and is saved in the background (undone on error);
 * signed out, it opens the sign-in sheet instead.
 */
export function VisitorActions({
  name,
  username,
  whatsapp,
  signedIn,
  following: saved,
}: {
  name: string;
  username: string;
  /** The business's WhatsApp link (first in its socials, required). */
  whatsapp: WhatsappLink;
  signedIn: boolean;
  /** Whether the signed-in user follows it (as stored). */
  following: boolean;
}) {
  const { t } = useLocale();
  const { open: signIn } = useAuthSheet();
  const [following, setOptimistic] = useOptimistic(saved);
  const [, startTransition] = useTransition();

  const toggle = () => {
    if (!signedIn) return signIn();
    const next = !following;
    startTransition(async () => {
      setOptimistic(next);
      const result = await setFollowing(username, next);
      if (!result.ok) toast.add({ title: t(result.error), type: "error" });
    });
  };

  const order = withMessage(
    whatsapp,
    t("Hi {{name}}, I'd like to place an order (via Qura).", { name }),
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        variant={following ? "outline" : "secondary"}
        size="xl"
        className={cn("rounded-xl", !following && "text-primary")}
        aria-pressed={following}
        onClick={toggle}
      >
        <HugeiconsIcon
          icon={following ? Tick02Icon : UserAdd01Icon}
          strokeWidth={2}
        />
        {following ? t("Following") : t("Follow")}
      </Button>
      {/* A real link (opens WhatsApp), styled as a button. WhatsApp's own
          green, like its button everywhere else. */}
      <a
        href={order}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          buttonVariants({ size: "xl" }),
          "rounded-xl bg-[#25D366] text-white hover:bg-[#1EBE5A]",
        )}
      >
        <HugeiconsIcon icon={WhatsappIcon} strokeWidth={2} />
        {t("Order on WhatsApp")}
      </a>
    </div>
  );
}

/** Share icon for the top bar of someone else's profile. */
export function ShareProfileButton({
  name,
  username,
}: {
  name: string;
  username: string;
}) {
  const { t } = useLocale();
  const share = useShare();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11 rounded-full"
      aria-label={t("Share profile")}
      onClick={() =>
        share({
          title: `${name} (@${username})`,
          url: href("business", { params: { username } }),
        })
      }
    >
      <HugeiconsIcon icon={Share08Icon} strokeWidth={2} className="size-6" />
    </Button>
  );
}
