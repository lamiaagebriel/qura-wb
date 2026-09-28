"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { HugeiconsIcon, Logout03Icon } from "@/components/icons";
import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { Button, ButtonProps } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";
import { useLocale } from "@/lib/i18n/provider";

/** Sign out, after confirming in a bottom sheet. */
export function SignOutButton({ ...props }: ButtonProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setConfirming(true)} {...props}>
        <HugeiconsIcon
          icon={Logout03Icon}
          strokeWidth={2}
          className="rtl:rotate-180"
        />
        {t("Sign out")}
      </Button>

      <ConfirmSheet
        open={confirming}
        onOpenChange={setConfirming}
        title={t("Sign out of Qura?")}
        description={t("You can sign back in anytime with Google.")}
        confirmLabel={t("Sign out")}
        destructive
        onConfirm={async () => {
          await signOut();
          // Stay on this page, re-rendered signed out (sign-in is a sheet).
          // The active profile will be cleared here once it's stored separately.
          router.refresh();
        }}
      />
    </>
  );
}
