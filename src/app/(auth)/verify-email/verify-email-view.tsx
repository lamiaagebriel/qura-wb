"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { AuthCard, AuthHeading } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup } from "@/components/ui/field";
import { useCooldown } from "@/hooks/use-cooldown";
import {
  resendVerificationEmailAction,
  verifyEmailAction,
} from "@/lib/auth/actions/verify-email";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";

type ConfirmStatus = "verifying" | "success" | "error";

function ConfirmView({ token }: { token: string }) {
  const { t } = useLocale();
  const [status, setStatus] = useState<ConfirmStatus>("verifying");

  useEffect(() => {
    let cancelled = false;
    verifyEmailAction(token).then((result) => {
      if (!cancelled) setStatus(result.success ? "success" : "error");
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "verifying") {
    return (
      <AuthCard className="w-full">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <Loader2 className="text-primary size-7 animate-spin" />
          <AuthHeading
            title={t("Verifying your email…")}
            subtitle={t("Hang tight, this only takes a second.")}
            className="mb-0"
          />
        </div>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard className="w-full">
        <AuthHeading
          title={
            <>
              {t("You're verified!")} <span aria-hidden>🎉</span>
            </>
          }
          subtitle={t("Your account is active. Time to explore your city.")}
        />
        <Button asChild className="w-full">
          {/* Signup already starts a session before verification, so the
              common case is this browser is still logged in — send them
              straight in. If it isn't (e.g. verified from a different
              device), `/dashboard`'s own guard bounces to `/login` for us,
              so this link is correct either way without knowing which case
              it is. */}
          <Link href="/dashboard">{t("Go to your dashboard")}</Link>
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard className="w-full">
      <AuthHeading
        title={t("Verification failed")}
        subtitle={t(
          "This link is invalid or has expired. Request a new verification email to continue.",
        )}
      />
      <Button asChild className="w-full">
        <Link href="/verify-email">{t("Resend verification link")}</Link>
      </Button>
    </AuthCard>
  );
}

function PendingView({ email }: { email: string }) {
  const { t } = useLocale();
  const cooldown = useCooldown(60);

  async function handleResend() {
    const result = await resendVerificationEmailAction();
    if (!result.success) {
      // Still worth the cooldown UI even though the request didn't go
      // through again — it's already ticking down for a reason.
      if (result.error.kind === "message" && result.error.code === "rate_limited") {
        cooldown.start();
        return;
      }
      handleAppError(result.error);
      return;
    }
    cooldown.start();
  }

  return (
    <AuthCard className="w-full">
      <AuthHeading
        title={t("Verify your email")}
        subtitle={
          <>
            {t("We've sent a verification link to")}{" "}
            <span className="text-foreground font-medium">{email}</span>.{" "}
            {t("Click it to activate your profile and start posting.")}
          </>
        }
      />
      <FieldGroup>
        <Field className="items-center gap-3 text-center">
          <FieldDescription>{t("Didn't get the email?")}</FieldDescription>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={cooldown.isActive}
            onClick={handleResend}
          >
            {cooldown.isActive
              ? t("Resend available in {{seconds}}s").replace(
                  "{{seconds}}",
                  String(cooldown.remaining),
                )
              : t("Resend verification link")}
          </Button>
          <FieldDescription className="flex flex-col gap-1">
            <span>
              {t("Wrong email address?")}{" "}
              <Link href="/signup" className="underline underline-offset-4">
                {t("Go back")}
              </Link>
            </span>
            <span>
              {t("Already verified?")}{" "}
              <Link href="/login" className="underline underline-offset-4">
                {t("Sign in")}
              </Link>
            </span>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </AuthCard>
  );
}

export function VerifyEmailView(props: { token: string } | { email: string }) {
  if ("token" in props) {
    return <ConfirmView token={props.token} />;
  }
  return <PendingView email={props.email} />;
}
