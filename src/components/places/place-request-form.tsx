"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";

import {
  FormError,
  INPUT,
  LocalizedField,
  TextareaField,
} from "@/components/form";
import { canGoBack } from "@/components/navigation/history";
import { PlaceField } from "@/components/places/place-field";
import { requestPlace } from "@/components/places/place-actions";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import { inLocale } from "@/lib/localized";
import {
  OTHER_TYPE,
  PLACE_NAME_MAX,
  placeRequestSchema,
  REASON_MAX,
  type PlaceRequestInput,
  type PlaceRequestValues,
} from "@/lib/place-requests";
import type { PlaceTypeOption } from "@/lib/places";
import { cn } from "@/lib/utils";

/**
 * Asking for a new place: where it is (the place it's inside), its name,
 * what kind of place it is and why. An admin of that place, or the super
 * admin, answers it.
 */
export function PlaceRequestForm({
  parent,
  types,
  done,
}: {
  parent: string;
  types: PlaceTypeOption[];
  /** Where to go once sent. */
  done: string;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const form = useForm<PlaceRequestValues, unknown, PlaceRequestInput>({
    resolver: zodResolver(placeRequestSchema) as Resolver<
      PlaceRequestValues,
      unknown,
      PlaceRequestInput
    >,
    defaultValues: {
      parent,
      name: { en: "", ar: "" },
      type: types[0]?.id ?? OTHER_TYPE,
      customType: "",
      reason: "",
    },
  });
  const type = useWatch({ control: form.control, name: "type" });

  const submit = form.handleSubmit(async (values) => {
    (document.activeElement as HTMLElement | null)?.blur();
    const result = await requestPlace(values);
    if (!result.ok) {
      const fields = Object.entries(result.fields ?? {});
      if (!fields.length) toast.add({ title: t(result.error), type: "error" });
      fields.forEach(([path, message], i) =>
        form.setError(
          path as keyof PlaceRequestValues,
          { message },
          { shouldFocus: i === 0 },
        ),
      );
      return;
    }
    toast.add({ title: t("Request sent") });
    if (canGoBack()) router.back();
    else router.replace(done);
  });

  const choices = [
    ...types.map((option) => ({ id: option.id, label: inLocale(option.name, locale) })),
    { id: OTHER_TYPE, label: t("Other") },
  ];

  return (
    <form className="flex flex-col gap-5 pt-2 pb-8" onSubmit={submit}>
      <Controller
        control={form.control}
        name="parent"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="place-parent">{t("Inside")}</FieldLabel>
            <PlaceField
              id="place-parent"
              value={field.value}
              label={t("Inside")}
              onChange={field.onChange}
            />
            <FieldDescription>
              {t("The place your new place is part of.")}
            </FieldDescription>
            <FormError error={fieldState.error} />
          </Field>
        )}
      />

      <LocalizedField
        control={form.control}
        name="name"
        label={t("Name")}
        inputLabels={{
          en: t("Name (English)"),
          ar: t("Name (Arabic)"),
        }}
        maxLength={PLACE_NAME_MAX}
      />

      <Controller
        control={form.control}
        name="type"
        render={({ field }) => (
          <Field>
            <FieldLabel id="place-type">{t("What kind of place?")}</FieldLabel>
            <div
              role="radiogroup"
              aria-labelledby="place-type"
              className="flex flex-wrap gap-2"
            >
              {choices.map((choice) => {
                const selected = field.value === choice.id;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => field.onChange(choice.id)}
                    className={cn(
                      "flex h-11 items-center rounded-full px-4 text-sm font-medium ring-1 ring-foreground/10",
                      selected ? "bg-primary text-primary-foreground" : "bg-card",
                    )}
                  >
                    {choice.label}
                  </button>
                );
              })}
            </div>
          </Field>
        )}
      />

      {type === OTHER_TYPE && (
        <Controller
          control={form.control}
          name="customType"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="place-custom-type">
                {t("Kind of place")}
              </FieldLabel>
              <Input
                {...field}
                id="place-custom-type"
                maxLength={50}
                enterKeyHint="next"
                autoComplete="off"
                aria-invalid={fieldState.invalid}
                className={INPUT}
              />
              <FormError error={fieldState.error} />
            </Field>
          )}
        />
      )}

      <TextareaField
        control={form.control}
        name="reason"
        label={t("Why add it? (optional)")}
        maxLength={REASON_MAX}
        enterKeyHint="done"
      />

      <Button
        type="submit"
        size="xl"
        className="rounded-xl"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && <Spinner />}
        {t("Send request")}
      </Button>
    </form>
  );
}
