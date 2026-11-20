"use client";

import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { useAction } from "@/hooks/use-action";

import { requestStatusChange } from "@/server/actions/business-status";

/**
 * "Report it as closed?" — a signed-in visitor tells us a business has
 * closed (recorded as a request). Opened from the business
 * page's options sheet; `onReported` hides that option afterwards.
 */
export function ReportClosedSheet({
  username,
  open,
  onOpenChange,
  onReported,
}: {
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReported: () => void;
}) {
  const { run, t } = useAction();
  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("Report it as closed?")}
      confirmLabel={t("Report")}
      onConfirm={async () => {
        await run(() => requestStatusChange(username, "close"), {
          success: "Thanks, we'll check if it's closed.",
          onDone: onReported,
        });
      }}
    />
  );
}
