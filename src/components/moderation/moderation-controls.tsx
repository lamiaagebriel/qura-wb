"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Flag01Icon, HugeiconsIcon } from "@/components/icons";
import {
  answerBusinessReport,
  dismissPostReports,
  hidePost,
  reportBusiness,
  reportPost,
  reviewHiddenPost,
  type ModerationResult,
} from "@/components/moderation/moderation-actions";
import { ActionSheet } from "@/components/sheets/action-sheet";
import { ReasonSheet } from "@/components/sheets/reason-sheet";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";
import { REASON_LABELS, REPORT_REASONS } from "@/lib/tickets/types";
import { cn } from "@/lib/utils";

/** Runs an action: a toast either way, then the screen refreshes. Returns ok. */
function useRun() {
  const { t } = useLocale();
  const router = useRouter();
  return async (action: () => Promise<ModerationResult>, success: MessageKey) => {
    const result = await action();
    if (!result.ok) {
      toast.add({ title: t(result.error), type: "error" });
      return false;
    }
    toast.add({ title: t(success) });
    router.refresh();
    return true;
  };
}

/**
 * Reporting a post or a business: pick why (an action sheet); its place's
 * admins look at it. Signed out, it opens the sign-in sheet. `look`: a
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
          <HugeiconsIcon icon={Flag01Icon} strokeWidth={2} className="size-5" />
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => (signedIn ? setOpen(true) : signIn())}
          className="mx-auto flex h-11 items-center gap-2 px-3 text-sm text-muted-foreground"
        >
          <HugeiconsIcon icon={Flag01Icon} strokeWidth={2} className="size-4" />
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
  const { t } = useLocale();
  const run = useRun();
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
      "Thanks, an admin will look at it.",
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

/** A reported post: hide it (with a reason the author sees) or dismiss the reports. */
export function ModeratePost({ id }: { id: string }) {
  const { t } = useLocale();
  const run = useRun();
  const [hiding, setHiding] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <Button
        size="xl"
        variant="destructive"
        className="flex-1 rounded-xl"
        disabled={pending}
        onClick={() => setHiding(true)}
      >
        {t("Hide post")}
      </Button>
      <Button
        size="xl"
        variant="outline"
        className="flex-1 rounded-xl"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await run(() => dismissPostReports(id), "Reports dismissed");
          })
        }
      >
        {pending && <Spinner />}
        {t("Nothing wrong")}
      </Button>
      <ReasonSheet
        open={hiding}
        onOpenChange={setHiding}
        title={t("Hide this post?")}
        description={t("Only its author will see it, with your reason, to edit or delete it.")}
        label={t("Reason")}
        confirmLabel={t("Hide post")}
        destructive
        required
        onConfirm={(reason) => run(() => hidePost(id, reason), "Post hidden")}
      />
    </div>
  );
}

/** A hidden post its author edited: show it again, or keep it hidden (a new reason). */
export function ReviewHiddenPost({ id }: { id: string }) {
  const { t } = useLocale();
  const run = useRun();
  const [keeping, setKeeping] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <Button
        size="xl"
        className="flex-1 rounded-xl"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await run(() => reviewHiddenPost(id, true), "Post shown again");
          })
        }
      >
        {pending && <Spinner />}
        {t("Show again")}
      </Button>
      <Button
        size="xl"
        variant="outline"
        className="flex-1 rounded-xl"
        disabled={pending}
        onClick={() => setKeeping(true)}
      >
        {t("Keep hidden")}
      </Button>
      <ReasonSheet
        open={keeping}
        onOpenChange={setKeeping}
        title={t("Keep it hidden?")}
        description={t("They'll see your reason.")}
        label={t("Reason")}
        confirmLabel={t("Keep hidden")}
        required
        onConfirm={(reason) => run(() => reviewHiddenPost(id, false, reason), "Saved")}
      />
    </div>
  );
}

/** A business report, for a place admin: dismiss it or send it to the Qura team. */
export function AnswerBusinessReport({ id }: { id: string }) {
  const { t } = useLocale();
  const run = useRun();
  const [pending, startTransition] = useTransition();
  const act = (action: "dismiss" | "escalate", success: MessageKey) =>
    startTransition(async () => {
      await run(() => answerBusinessReport(id, action), success);
    });
  return (
    <div className="flex gap-2">
      <Button
        size="xl"
        className={cn("flex-1 rounded-xl")}
        disabled={pending}
        onClick={() => act("escalate", "Sent to the Qura team")}
      >
        {t("Send to the Qura team")}
      </Button>
      <Button
        size="xl"
        variant="outline"
        className="flex-1 rounded-xl"
        disabled={pending}
        onClick={() => act("dismiss", "Report dismissed")}
      >
        {pending && <Spinner />}
        {t("Nothing wrong")}
      </Button>
    </div>
  );
}
