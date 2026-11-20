"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  cancelPlaceRequest,
} from "@/server/actions/place-requests";
import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import type { ActionResult } from "@/lib/action-result";
import type { MessageKey } from "@/lib/i18n/types";

/** Runs an action: a toast either way, then the screen refreshes. Returns ok. */
function useRun() {
  const { t } = useLocale();
  const router = useRouter();
  return async (action: () => Promise<ActionResult>, success: MessageKey) => {
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

/** Take back your own waiting request. */
export function CancelPlaceRequest({ id }: { id: string }) {
  const { t } = useLocale();
  const run = useRun();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="xl"
        variant="outline"
        className="w-full rounded-xl"
        onClick={() => setOpen(true)}
      >
        {t("Cancel request")}
      </Button>
      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title={t("Cancel this request?")}
        confirmLabel={t("Cancel request")}
        destructive
        onConfirm={async () => {
          await run(() => cancelPlaceRequest(id), "Request cancelled");
        }}
      />
    </>
  );
}
