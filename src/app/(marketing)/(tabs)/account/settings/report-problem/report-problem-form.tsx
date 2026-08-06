"use client";

import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { reportProblemAction } from "@/lib/profile/actions/report-problem";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import {
  createReportProblemSchema,
  type ReportProblemValues,
} from "@/lib/validations/profile";
import { createZodResolver } from "@/lib/validations/resolver";

export function ReportProblemForm() {
  const { t } = useLocale();
  const schema = useMemo(() => createReportProblemSchema(t), [t]);

  const form = useForm<ReportProblemValues>({
    resolver: createZodResolver(schema),
    defaultValues: { message: "" },
  });

  async function onSubmit(values: ReportProblemValues) {
    const result = await reportProblemAction(values);
    if (!result.success) {
      handleAppError(result.error, form);
      return;
    }
    toast.success(t("Thanks — we've received your report."));
    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Controller
          name="message"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Textarea
                {...field}
                rows={6}
                placeholder={t("Describe what went wrong…")}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : (
                <FieldDescription>
                  {t("We read every report, but won't be able to follow up individually.")}
                </FieldDescription>
              )}
            </Field>
          )}
        />
        <Field>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {t("Submit")}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
