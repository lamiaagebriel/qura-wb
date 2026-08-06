"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/lib/auth/actions/update-profile";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import {
  createEditProfileSchema,
  type EditProfileValues,
} from "@/lib/validations/profile";
import { createZodResolver } from "@/lib/validations/resolver";

export function EditProfileForm({
  defaultValues,
}: {
  defaultValues: EditProfileValues;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const schema = useMemo(() => createEditProfileSchema(t), [t]);

  const form = useForm<EditProfileValues>({
    resolver: createZodResolver(schema),
    defaultValues,
  });

  async function onSubmit(values: EditProfileValues) {
    const result = await updateProfileAction(values);
    if (!result.success) {
      handleAppError(result.error, form);
      return;
    }
    toast.success(t("Profile updated."));
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("Full name")}</FieldLabel>
              <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="username"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("Username")}</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoCapitalize="none"
                autoCorrect="off"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="bio"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>{t("Bio")}</FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                maxLength={150}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  {(field.value?.length ?? 0)}/150
                </FieldDescription>
              )}
            </Field>
          )}
        />
        <Field>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {t("Save")}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
