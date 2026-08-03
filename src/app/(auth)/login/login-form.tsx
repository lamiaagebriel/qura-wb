"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";

import { AuthCard, AuthHeading } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/lib/auth/actions/sign-in";
import { messageError } from "@/lib/errors";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { createLoginSchema, type LoginValues } from "@/lib/validations/auth";
import { createZodResolver } from "@/lib/validations/resolver";

// Every query-string `?error=` code the app can land on `/login` with —
// OAuth failures and the suspended-account bounce from `getGuardedUser()`
// both funnel through here so there's exactly one place mapping codes to
// copy.
const LOGIN_ERROR_KEYS = {
  oauth_unavailable: "Google sign-in isn't available right now.",
  oauth_failed: "Something went wrong signing in with Google. Please try again.",
  account_suspended: "Your account has been suspended. Contact support for help.",
} as const;

export function LoginForm({
  oauthError: queryError,
  className,
  ...props
}: React.ComponentProps<typeof AuthCard> & { oauthError?: string }) {
  const { t } = useLocale();
  const schema = useMemo(() => createLoginSchema(t), [t]);

  const form = useForm<LoginValues>({
    resolver: createZodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!queryError) return;
    const key =
      queryError in LOGIN_ERROR_KEYS
        ? LOGIN_ERROR_KEYS[queryError as keyof typeof LOGIN_ERROR_KEYS]
        : "Something went wrong. Please try again.";
    handleAppError(messageError(t(key)));
    // Only meant to run once for the error code the page loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryError]);

  async function onSubmit(values: LoginValues) {
    const result = await signInAction(values);
    // A successful sign-in redirects server-side and never resolves here.
    if (!result.success) {
      handleAppError(result.error, form);
    }
  }

  return (
    <AuthCard className={cn("w-full", className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <AuthHeading
          title={t("Welcome back")}
          subtitle={t("Sign in to keep your city moving.")}
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
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex items-center">
                  <FieldLabel htmlFor={field.name}>
                    {t("Password")}
                  </FieldLabel>
                  <Link
                    href="/forgot-password"
                    className="text-muted-foreground hover:text-foreground ms-auto text-xs underline-offset-4 hover:underline"
                  >
                    {t("Forgot your password?")}
                  </Link>
                </div>
                <PasswordInput
                  {...field}
                  id={field.name}
                  autoComplete="current-password"
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
              {t("Sign in")}
            </Button>
          </Field>
          <FieldSeparator>{t("Or continue with")}</FieldSeparator>
          <Field>
            <GoogleButton callbackURL="/account" className="w-full">
              {t("Continue with Google")}
            </GoogleButton>
            <FieldDescription className="text-center">
              {t("New to Qura?")}{" "}
              <Link href="/signup" className="underline underline-offset-4">
                {t("Create your profile")}
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
