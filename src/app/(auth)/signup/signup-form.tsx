"use client";

import { useMemo } from "react";
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
import { signUpAction } from "@/lib/auth/actions/sign-up";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { createSignupSchema, type SignupValues } from "@/lib/validations/auth";
import { createZodResolver } from "@/lib/validations/resolver";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<typeof AuthCard>) {
  const { t } = useLocale();
  const schema = useMemo(() => createSignupSchema(t), [t]);

  const form = useForm<SignupValues>({
    resolver: createZodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignupValues) {
    const result = await signUpAction(values);
    // Success redirects server-side (to /verify-email) and never resolves here.
    if (!result.success) {
      handleAppError(result.error, form);
    }
  }

  return (
    <AuthCard className={cn("w-full", className)} {...props}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <AuthHeading
          title={t("Create your profile")}
          subtitle={t("Join your city's feed — it takes less than a minute.")}
        />
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t("Full name")}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="text"
                  placeholder="Jane Cooper"
                  autoComplete="name"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
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
                <FieldLabel htmlFor={field.name}>
                  {t("Password")}
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
          <Field>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {t("Create my profile")}
            </Button>
          </Field>
          <FieldSeparator>{t("Or continue with")}</FieldSeparator>
          <Field>
            <GoogleButton callbackURL="/dashboard" className="w-full">
              {t("Continue with Google")}
            </GoogleButton>
            <FieldDescription className="text-center text-balance">
              {t("By creating an account, you agree to our")}{" "}
              <Link href="#">{t("Terms of Service")}</Link> {t("and")}{" "}
              <Link href="#">{t("Privacy Policy")}</Link>.
            </FieldDescription>
            <FieldDescription className="text-center">
              {t("Already have an account?")}{" "}
              <Link href="/login" className="underline underline-offset-4">
                {t("Sign in")}
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
