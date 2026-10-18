"use client";

import { useOptimistic, useState, useTransition } from "react";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import {
  Flag01Icon,
  HugeiconsIcon,
  MoreHorizontalCircle01Icon,
  Share08Icon,
  Store01Icon,
  Tick02Icon,
  UserAdd01Icon,
  WhatsappIcon,
} from "@/components/icons";
import { ReportSheets } from "@/components/moderation/moderation-controls";
import { ActionSheet, type SheetAction } from "@/components/sheets/action-sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import { href } from "@/lib/routes";
import { useShare } from "@/lib/share";
import { withMessage, type WhatsappLink } from "@/lib/socials";
import { cn } from "@/lib/utils";

import { ReportClosedSheet } from "./report-closed";
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
  /** The business's WhatsApp link (none: no order button). */
  whatsapp?: WhatsappLink;
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

  const order =
    whatsapp &&
    withMessage(
      whatsapp,
      t("Hi {{name}}, I'd like to place an order (via Qura).", { name }),
    );

  return (
    <div className={cn("grid gap-2", order && "grid-cols-2")}>
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
      {order && (
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
      )}
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

/**
 * The top bar's "…" on someone else's business: an action sheet with
 * Share profile, "Has this place closed?" (when it can be reported and you
 * haven't yet) and Report this business. Reporting needs an account:
 * signed out, those open the sign-in sheet.
 */
export function BusinessOptionsButton({
  name,
  username,
  signedIn,
  canReportClosed,
  reportedClosed,
}: {
  name: string;
  username: string;
  signedIn: boolean;
  /** "Has this place closed?" applies to it (an active business). */
  canReportClosed: boolean;
  /** You already reported it as closed (waiting for an admin). */
  reportedClosed: boolean;
}) {
  const { t } = useLocale();
  const share = useShare();
  const { open: signIn } = useAuthSheet();
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState<"closed" | "report" | null>(null);
  const [reported, setReported] = useState(reportedClosed);
  const signedInOnly = (next: "closed" | "report") => () =>
    signedIn ? setSheet(next) : signIn();

  const actions: SheetAction[] = [
    {
      label: t("Share profile"),
      icon: Share08Icon,
      onSelect: () =>
        share({
          title: `${name} (@${username})`,
          url: href("business", { params: { username } }),
        }),
    },
    ...(canReportClosed && !reported
      ? [
          {
            label: t("Has this place closed? Tell us"),
            icon: Store01Icon,
            onSelect: signedInOnly("closed"),
          },
        ]
      : []),
    {
      label: t("Report this business"),
      icon: Flag01Icon,
      destructive: true,
      onSelect: signedInOnly("report"),
    },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 rounded-full"
        aria-label={t("More options")}
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon
          icon={MoreHorizontalCircle01Icon}
          strokeWidth={2}
          className="size-6"
        />
      </Button>
      <ActionSheet open={open} onOpenChange={setOpen} actions={actions} />
      <ReportClosedSheet
        username={username}
        open={sheet === "closed"}
        onOpenChange={(next) => !next && setSheet(null)}
        onReported={() => setReported(true)}
      />
      <ReportSheets
        kind="business"
        target={username}
        open={sheet === "report"}
        onOpenChange={(next) => !next && setSheet(null)}
      />
    </>
  );
}
