"use client";

import { useState } from "react";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Flag01Icon, HugeiconsIcon } from "@/components/icons";
import { ActionSheet } from "@/components/sheets/action-sheet";
import { ReasonSheet } from "@/components/sheets/reason-sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { REASON_LABELS, REPORT_REASONS } from "@/lib/tickets/types";
import { reportBusiness, reportPost } from "@/server/actions/reports";

/**
 * Reporting a post or a business: pick why (an action sheet); it's
 * recorded. Signed out, it opens the sign-in sheet. `look`: a
 * header icon (posts) or a quiet text link (business pages).
 */
export function ReportButton({
  kind,
  target,
  signedIn,
  look = "icon",
}: {
  kind: "post" | "business";
  /** The post's id, or the business's @handle. */
  target: string;
  signedIn: boolean;
  look?: "icon" | "link";
}) {
  const { t } = useLocale();
  const { open: signIn } = useAuthSheet();
  const [open, setOpen] = useState(false);
  const label = kind === "post" ? t("Report post") : t("Report this business");

  return (
    <>
      {look === "icon" ? (
        <Button
          variant="ghost"
          className="size-11 rounded-full"
          aria-label={label}
          onClick={() => (signedIn ? setOpen(true) : signIn())}
        >
          <HugeiconsIcon icon={Flag01Icon} className="size-5" />
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => (signedIn ? setOpen(true) : signIn())}
          className={cn(buttonVariants({ variant: "link" }), "mx-auto h-11 gap-2 px-3 text-muted-foreground")}
        >
          <HugeiconsIcon icon={Flag01Icon} className="size-4" />
          {label}
        </button>
      )}
      <ReportSheets kind={kind} target={target} open={open} onOpenChange={setOpen} />
    </>
  );
}

/**
 * The sheets behind reporting (why → "Something else" asks what), opened by
 * `ReportButton` or by another control (a business page's options sheet).
 */
export function ReportSheets({
  kind,
  target,
  open,
  onOpenChange: setOpen,
}: {
  kind: "post" | "business";
  target: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { run, t } = useAction();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const reasons =
    kind === "post"
      ? REPORT_REASONS.post.map((reason) => ({ reason, label: REASON_LABELS[reason] }))
      : REPORT_REASONS.business.map((reason) => ({ reason, label: REASON_LABELS[reason] }));
  const send = (reason: string, note = "") =>
    run(
      () =>
        kind === "post"
          ? reportPost(target, reason, note)
          : reportBusiness(target, reason, note),
      { success: "Thanks for letting us know." },
    );
  const label = kind === "post" ? t("Report post") : t("Report this business");

  return (
    <>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title={label}
        description={t("What's wrong with it?")}
        actions={reasons.map(({ reason, label: reasonLabel }) => ({
          label: t(reasonLabel),
          // "Something else" asks what.
          onSelect: () => (reason === "other" ? setNoteFor(reason) : void send(reason)),
        }))}
      />
      <ReasonSheet
        open={noteFor !== null}
        onOpenChange={(next) => !next && setNoteFor(null)}
        title={label}
        label={t("What's wrong with it?")}
        confirmLabel={t("Report")}
        required
        onConfirm={(note) => send(noteFor ?? "other", note)}
      />
    </>
  );
}
