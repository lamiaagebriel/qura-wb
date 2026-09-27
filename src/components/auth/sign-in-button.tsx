"use client";

import { useAuthSheet } from "@/components/auth/auth-sheet";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";

/** Opens the sign-in sheet. */
export function SignInButton({ children, ...props }: ButtonProps) {
  const { t } = useLocale();
  const { open } = useAuthSheet();

  return (
    <Button onClick={() => open()} {...props}>
      {children ?? t("Sign in")}
    </Button>
  );
}
