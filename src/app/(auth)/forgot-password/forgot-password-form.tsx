"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";

import { AuthCard, AuthHeading } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCooldown } from "@/hooks/use-cooldown";
import { requestPasswordResetAction } from "@/lib/auth/actions/forgot-password";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { SafeUser } from "@/lib/auth/guard";
import {
  createForgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";
import { createZodResolver } from "@/lib/validations/resolver";

export function ForgotPasswordForm({
  user,
  className,
  ...props
}: React.ComponentProps<typeof AuthCard> & { user?: SafeUser | null }) {
  const { t } = useLocale();
  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const cooldown = useCooldown(60);

  const form = useForm<ForgotPasswordValues>({
    resolver: createZodResolver(schema),
    defaultValues: { email: user?.email ?? "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    const result = await requestPasswordResetAction(values);
    if (!result.success) {
      handleAppError(result.error, form);
      return;
    }
    setSentTo(values.email);
    cooldown.start();
  }

  async function handleResend() {
    if (!sentTo) return;
    const result = await requestPasswordResetAction({ email: sentTo });
    if (!result.success) {
      handleAppError(result.error);
      return;
    }
    cooldown.start();
  }

  if (sentTo) {
    return (
      <AuthCard className={cn("w-full", className)} {...props}>
        <AuthHeading
          title={t("Check your email")}
          subtitle={
            <>
              {t("We've sent a password reset link to")}{" "}
              <span className="text-foreground font-medium">{sentTo}</span>.{" "}
              {t("It may take a minute to arrive.")}
            </>
          }
        />
        <FieldGroup>
          <Field className="items-center gap-3 text-center">
            <FieldDescription>{t("Didn't get it?")}</FieldDescription>
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
                : t("Resend link")}
            </Button>
            <FieldDescription>
              <Link href="/login" className="underline underline-offset-4">
                {t("Back to sign in")}
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </AuthCard>
    );
  }

  return (
    <AuthCard className={cn("w-full", className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <AuthHeading
          title={t("Forgot your password?")}
          subtitle={
            user
              ? t(
                  "You're signed in — send a reset link for this account, or change the email below to reset a different one.",
                )
              : t(
                  "Enter the email on your account and we'll send you a reset link.",
                )
          }
        />
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>{t("Email")}</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Field>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {t("Send reset link")}
            </Button>
            <FieldDescription className="text-center">
              <Link href="/login" className="underline underline-offset-4">
                {t("Back to sign in")}
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
