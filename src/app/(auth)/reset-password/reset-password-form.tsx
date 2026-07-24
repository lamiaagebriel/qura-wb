"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";

import { AuthCard, AuthHeading } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { resetPasswordAction } from "@/lib/auth/actions/reset-password";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import {
  createResetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth";
import { createZodResolver } from "@/lib/validations/resolver";

export function ResetPasswordForm({
  token,
  className,
  ...props
}: React.ComponentProps<typeof AuthCard> & { token?: string }) {
  const { t } = useLocale();
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);
  const [done, setDone] = useState(false);
  const [tokenRejected, setTokenRejected] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: createZodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // No token in the URL, or the server rejected it as expired/used/invalid —
  // both cases get the same "request a new one" state.
  if (!token || tokenRejected) {
    return (
      <AuthCard className={cn("w-full", className)} {...props}>
        <AuthHeading
          title={t("This link has expired")}
          subtitle={t(
            "Password reset links are only valid for a little while. Request a new one to continue.",
          )}
        />
        <Button asChild className="w-full">
          <Link href="/forgot-password">{t("Request a new link")}</Link>
        </Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard className={cn("w-full", className)} {...props}>
        <AuthHeading
          title={t("Password updated")}
          subtitle={t(
            "Your password has been changed. You can now sign in.",
          )}
        />
        <Button asChild className="w-full">
          <Link href="/login">{t("Continue to sign in")}</Link>
        </Button>
      </AuthCard>
    );
  }

  async function onSubmit(values: ResetPasswordValues) {
    const result = await resetPasswordAction(token as string, values);
    if (!result.success) {
      if (result.error.kind === "message" && result.error.code === "token_invalid") {
        setTokenRejected(true);
        return;
      }
      handleAppError(result.error, form);
      return;
    }
    setDone(true);
  }

  return (
    <AuthCard className={cn("w-full", className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <AuthHeading
          title={t("Set a new password")}
          subtitle={t("Make it strong — you'll use it to sign back in.")}
        />
        <FieldGroup>
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t("New password")}
                </FieldLabel>
                <PasswordInput
                  {...field}
                  id={field.name}
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  showLabel={t("Show password")}
                  hideLabel={t("Hide password")}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    {t("At least 8 characters.")}
                  </FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t("Confirm password")}
                </FieldLabel>
                <PasswordInput
                  {...field}
                  id={field.name}
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                  showLabel={t("Show password")}
                  hideLabel={t("Hide password")}
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
              {t("Reset password")}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
