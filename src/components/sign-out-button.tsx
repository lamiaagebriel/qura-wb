"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { HugeiconsIcon, Logout03Icon } from "@/components/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signOut } from "@/lib/auth/client";
import { useLocale } from "@/lib/i18n/provider";

export function SignOutButton({ ...props }: ButtonProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      // Stay on this page, re-rendered signed out (sign-in is a sheet now).
      // The active profile will be cleared here once it's stored separately.
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={handleSignOut}
      {...props}
    >
      {pending ? (
        <Spinner />
      ) : (
        <HugeiconsIcon
          icon={Logout03Icon}
          strokeWidth={2}
          className="rtl:rotate-180"
        />
      )}
      {t("Sign out")}
    </Button>
  );
}
