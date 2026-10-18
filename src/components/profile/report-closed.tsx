"use client";

import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";

import { requestStatusChange } from "./status-actions";

/**
 * "Report it as closed?" — a signed-in visitor tells us a business has
 * closed (an admin checks before closing it). Opened from the business
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
  const { t } = useLocale();
  return (
    <ConfirmSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("Report it as closed?")}
      description={t("An admin will check before it's marked closed.")}
      confirmLabel={t("Report")}
      onConfirm={async () => {
        const result = await requestStatusChange(username, "close");
        if (!result.ok)
          return void toast.add({ title: t(result.error), type: "error" });
        onReported();
        toast.add({ title: t("Thanks, we'll check if it's closed.") });
      }}
    />
  );
}
