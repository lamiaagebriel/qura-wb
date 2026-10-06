"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { STATUS_LABELS } from "@/components/business-status-badge";
import {
  resolveRequest,
  setBusinessStatus,
  type StatusResult,
} from "@/components/profile/status-actions";
import { ActionSheet } from "@/components/sheets/action-sheet";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { allowedStatuses, type BusinessStatus } from "@/lib/business-status";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";

/** Runs an admin action: a toast either way, then the screen refreshes. */
function useRun() {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<StatusResult>, success: MessageKey) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.add({ title: t(result.error), type: "error" });
        return;
      }
      toast.add({ title: t(success) });
      router.refresh();
    });
  return { run, pending };
}

/** Make a business live in one tap (approve), or pick any other status. */
export function AdminStatusControls({
  username,
  status,
}: {
  username: string;
  status: BusinessStatus;
}) {
  const { t } = useLocale();
  const { run, pending } = useRun();
  const [open, setOpen] = useState(false);
  const set = (to: BusinessStatus) =>
    run(() => setBusinessStatus(username, to), "Status updated");

  return (
    <div className="flex gap-2">
      {status !== "active" && (
        <Button
          size="xl"
          className="flex-1 rounded-xl"
          disabled={pending}
          onClick={() => set("active")}
        >
          {pending && <Spinner />}
          {status === "pending" ? t("Approve") : t("Make live")}
        </Button>
      )}
      <Button
        size="xl"
        variant="outline"
        className="flex-1 rounded-xl"
        disabled={pending}
        onClick={() => setOpen(true)}
      >
        {t("Change status")}
      </Button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title={t("Change status")}
        actions={allowedStatuses("admin", status).map((to) => ({
          label: t(STATUS_LABELS[to]),
          destructive: to === "suspended",
          onSelect: () => set(to),
        }))}
      />
    </div>
  );
}

/** Approve (applies it) or reject an open close / reopen request. */
export function RequestControls({ id }: { id: string }) {
  const { t } = useLocale();
  const { run, pending } = useRun();
  return (
    <div className="flex gap-2">
      <Button
        size="xl"
        className="flex-1 rounded-xl"
        disabled={pending}
        onClick={() => run(() => resolveRequest(id, true), "Request approved")}
      >
        {t("Approve")}
      </Button>
      <Button
        size="xl"
        variant="outline"
        className="flex-1 rounded-xl"
        disabled={pending}
        onClick={() => run(() => resolveRequest(id, false), "Request rejected")}
      >
        {t("Reject")}
      </Button>
    </div>
  );
}
