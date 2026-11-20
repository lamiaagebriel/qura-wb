"use client";

import { useState } from "react";

import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { cancelPlaceRequest } from "@/server/actions/place-requests";

/** Take back your own waiting request. */
export function CancelPlaceRequest({ id }: { id: string }) {
  const { run, t } = useAction();
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
          await run(() => cancelPlaceRequest(id), { success: "Request cancelled" });
        }}
      />
    </>
  );
}
