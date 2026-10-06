"use client";

import { useState } from "react";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Flag01Icon, HugeiconsIcon } from "@/components/icons";
import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";

import { requestStatusChange } from "./status-actions";

/**
 * "Has this place closed?" under a business's page: a signed-in visitor
 * reports it (an admin checks before closing it); signed out, it opens
 * the sign-in sheet. Once reported, it says so.
 */
export function ReportClosed({
  username,
  signedIn,
  reported: alreadyReported,
}: {
  username: string;
  signedIn: boolean;
  reported: boolean;
}) {
  const { t } = useLocale();
  const { open: signIn } = useAuthSheet();
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(alreadyReported);

  if (reported)
    return (
      <p className="text-center text-sm text-muted-foreground">
        {t("Thanks, we'll check if it's closed.")}
      </p>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => (signedIn ? setOpen(true) : signIn())}
        className="mx-auto flex h-11 items-center gap-2 px-3 text-sm text-muted-foreground"
      >
        <HugeiconsIcon icon={Flag01Icon} strokeWidth={2} className="size-4" />
        {t("Has this place closed? Tell us")}
      </button>
      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title={t("Report it as closed?")}
        description={t("An admin will check before it's marked closed.")}
        confirmLabel={t("Report")}
        onConfirm={async () => {
          const result = await requestStatusChange(username, "close");
          if (!result.ok)
            return void toast.add({ title: t(result.error), type: "error" });
          setReported(true);
        }}
      />
    </>
  );
}
