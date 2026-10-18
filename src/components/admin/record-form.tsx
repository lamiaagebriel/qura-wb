"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Control, type FieldValues, type Resolver } from "react-hook-form";

import { saveRecord } from "@/components/admin/record-actions";
import { FormError, LocalizedField } from "@/components/form";
import { PlaceField } from "@/components/places/place-field";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { recordHref } from "@/lib/admin/links";
import { ADMIN_SCHEMAS, type EditableResource } from "@/lib/admin/schemas";
import type { Field as FieldSpec } from "@/lib/admin/types";
import { useLocale } from "@/lib/i18n/provider";

/**
 * A record's editable fields as a shadcn form, checked by the resource's
 * zod schema here and again on the server (`saveRecord`). `id` = "new"
 * adds a record and opens it once saved.
 */
export function RecordForm({
  resource,
  id,
  fields,
  values,
}: {
  resource: EditableResource;
  id: string;
  fields: FieldSpec[];
  values: Record<string, unknown>;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const form = useForm<FieldValues>({
    resolver: zodResolver(ADMIN_SCHEMAS[resource] as never) as Resolver<FieldValues>,
    defaultValues: values,
  });
  const { isSubmitting, isDirty } = form.formState;
  const adding = id === "new";

  const submit = form.handleSubmit(async () => {
    (document.activeElement as HTMLElement | null)?.blur();
    // The raw form values: the server parses them with the same schema.
    const result = await saveRecord(resource, id, form.getValues());
    if (!result.ok) {
      const errors = Object.entries(result.fields ?? {});
      // Said on a field when it's one of the form's, otherwise as a toast.
      const shown = errors.some(([path]) => fields.some((field) => field.name === path.split(".")[0]));
      if (!shown) toast.add({ title: t(result.error), type: "error" });
      errors.forEach(([path, message], i) => form.setError(path, { message }, { shouldFocus: i === 0 }));
      return;
    }
    toast.add({ title: adding ? t("Added") : t("Saved") });
    if (adding && result.id) router.replace(recordHref(resource, result.id));
    else {
      form.reset(form.getValues());
      router.refresh();
    }
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {fields.map((field) => (
        <FieldInput key={field.name} field={field} control={form.control} />
      ))}
      <div className="flex gap-2">
        <Button type="submit" size="lg" className="h-11 md:h-9" disabled={isSubmitting || (!adding && !isDirty)}>
          {isSubmitting && <Spinner />}
          {adding ? t("Add") : t("Save changes")}
        </Button>
        {!adding && isDirty && (
          <Button type="button" variant="ghost" size="lg" className="h-11 md:h-9" onClick={() => form.reset(values)}>
            {t("Undo changes")}
          </Button>
        )}
      </div>
    </form>
  );
}

function FieldInput({ field, control }: { field: FieldSpec; control: Control<FieldValues> }) {
  const { t } = useLocale();
  const id = `field-${field.name}`;

  if (field.kind === "localized") {
    return (
      <LocalizedField
        control={control}
        name={field.name}
        label={field.label}
        multiline={field.multiline}
        maxLength={field.max}
        inputLabels={{
          en: t("{{label}} (English)", { label: field.label }),
          ar: t("{{label}} (Arabic)", { label: field.label }),
        }}
      />
    );
  }

  return (
    <Controller
      control={control}
      name={field.name}
      render={({ field: input, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          {field.kind !== "switch" && <FieldLabel htmlFor={id}>{field.label}</FieldLabel>}
          {field.kind === "text" && (
            <Input
              {...input}
              id={id}
              value={(input.value as string) ?? ""}
              maxLength={field.max}
              dir={field.dir}
              autoComplete="off"
              aria-invalid={fieldState.invalid}
              className="h-11 md:h-9"
            />
          )}
          {field.kind === "textarea" && (
            <Textarea
              {...input}
              id={id}
              value={(input.value as string) ?? ""}
              maxLength={field.max}
              dir="auto"
              aria-invalid={fieldState.invalid}
              className="min-h-28"
            />
          )}
          {field.kind === "number" && (
            <Input
              {...input}
              id={id}
              type="number"
              inputMode="decimal"
              step={field.step ?? "any"}
              value={(input.value as string | number) ?? ""}
              dir="ltr"
              aria-invalid={fieldState.invalid}
              className="h-11 md:h-9"
            />
          )}
          {field.kind === "select" && (
            <Select items={field.options} value={input.value as string} onValueChange={(value) => input.onChange(value)}>
              <SelectTrigger id={id} aria-invalid={fieldState.invalid} className="h-11 w-full text-sm md:h-9 md:max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {field.kind === "switch" && (
            <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <span className="flex flex-col gap-0.5">
                <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                {field.description && <FieldDescription>{field.description}</FieldDescription>}
              </span>
              <Switch id={id} checked={!!input.value} onCheckedChange={(checked) => input.onChange(checked)} />
            </div>
          )}
          {field.kind === "place" && (
            <div className="flex items-center gap-2 md:max-w-sm">
              <div className="flex flex-1 flex-col">
                <PlaceField
                  id={id}
                  value={(input.value as string) ?? ""}
                  label={field.label}
                  emptyLabel={t("Top level")}
                  onChange={(slug) => input.onChange(slug)}
                />
              </div>
              {input.value && field.name === "parent" ? (
                <Button type="button" variant="ghost" className="h-11" onClick={() => input.onChange("")}>
                  {t("Clear")}
                </Button>
              ) : null}
            </div>
          )}
          <FormError error={fieldState.error} />
        </Field>
      )}
    />
  );
}
