"use client";

import { useState } from "react";

import { AlertCircleIcon, GoogleIcon, HugeiconsIcon } from "@/components/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { signIn } from "@/lib/auth/client";
import { loginPath } from "@/lib/auth/redirect";
import type { MessageKey } from "@/lib/i18n/types";
import { useLocale } from "@/lib/i18n/provider";

const ERROR_MESSAGES: Record<string, MessageKey> = {
  account_suspended:
    "Your account has been suspended. Contact support for help.",
  access_denied: "Google sign-in was cancelled.",
};

export function GoogleSignIn({
  next,
  error: initialError,
}: {
  next: string;
  error: string | null;
}) {
  const { t } = useLocale();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError);

  async function handleClick() {
    setPending(true);
    setError(null);

    const { error } = await signIn.social({
      provider: "google",
      callbackURL: next,
      errorCallbackURL: loginPath(next),
    });

    // On success the browser is already navigating to Google.
    if (error) {
      setError("unknown");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} />
          <AlertDescription>
            {t(ERROR_MESSAGES[error] ?? "Sign-in didn't work. Try again.")}
          </AlertDescription>
        </Alert>
      )}

      <Button
        size="xl"
        variant="outline"
        className="  w-full gap-2 rounded-xl text-sm transition-transform active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
        disabled={pending}
        aria-busy={pending}
        onClick={handleClick}
      >
        {pending ? (
          <Spinner className="size-5" />
        ) : (
          <HugeiconsIcon icon={GoogleIcon} strokeWidth={2} className="size-5" />
        )}
        {pending ? t("Opening Google…") : t("Continue with Google")}
      </Button>
    </div>
  );
}
