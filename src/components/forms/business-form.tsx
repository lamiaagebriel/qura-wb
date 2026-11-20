"use client";

import { useRouter } from "next/navigation";
import { type ComponentProps } from "react";
import { Controller, useWatch, type Control } from "react-hook-form";

import { FormError } from "@/components/forms/form-error";
import { LocalizedField } from "@/components/forms/localized-field";
import { UsernameField } from "@/components/forms/username-field";
import { HugeiconsIcon, Store01Icon } from "@/components/icons";
import { canGoBack } from "@/components/navigation/history";
import { saveBusiness } from "@/server/actions/businesses";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { categoryOf } from "@/lib/categories";
import { useActionForm } from "@/hooks/use-action-form";
import { useLocale } from "@/lib/i18n/provider";
import { href } from "@/lib/routes";
import {
  businessSchema,
  type BusinessFormValues,
} from "@/lib/validations/business-form";

import { CategoryPicker } from "@/components/profile/category-picker";
import {
  DeleteBusinessButton,
} from "@/components/profile/delete-business-button";
import { StatusPanel } from "@/components/profile/status-panel";
import { LocationFields } from "@/components/forms/business-branches-field";
import { HoursFields } from "@/components/forms/business-hours-field";
import { LinkFields } from "@/components/forms/business-links-field";
import { OwnerField } from "@/components/forms/business-owner-field";

type Form = Control<BusinessFormValues>;

/**
 * Everything about a business, in one form for both adding and editing:
 * names, @handle, category, bio, WhatsApp, phone numbers, links, branches,
 * opening hours and — for whoever adds it — who owns it.
 * `editing`: the business's current @handle, or `null` to create one.
 */
export function BusinessForm({
  initial,
  editing,
  canChooseOwner,
  mapsApiKey,
  categoryCounts,
  status,
  deletable = false,
}: {
  /** Editing: this user may delete it (`canDelete`). */
  deletable?: boolean;
  /** Businesses per category (all cities), shown in the category picker. */
  categoryCounts: Record<string, number>;
  /**
   * Editing: who this user is to the business and any request they have
   * open — what the status field lets them pick (`StatusPanel`). The
   * stored status itself is `initial.status`.
   */
  status?: Pick<ComponentProps<typeof StatusPanel>, "role" | "openRequest">;
  initial: BusinessFormValues;
  editing: string | null;
  canChooseOwner: boolean;
  /** GOOGLE_MAPS_API_KEY: pick pins on a map (hidden without it). */
  mapsApiKey: string | null;
}) {
  const { locale } = useLocale();
  const router = useRouter();
  const { form, submit, pending, t } = useActionForm<BusinessFormValues, { requested: boolean }>({
    schema: businessSchema,
    defaultValues: initial,
    mode: "onTouched",
    // Hours are kept in the owner's own zone, read from the device.
    action: (values) =>
      saveBusiness(editing, {
        ...values,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || values.timeZone,
      }),
    // Says whether a status change was only asked for.
    success: null,
    onDone: ({ requested }) => {
      toast.add({
        title:
          editing === null
            ? t("Business created")
            : requested
              ? t("Changes saved. Your status request was sent.")
              : t("Changes saved"),
      });
      if (canGoBack()) router.back();
      else router.replace(href("businesses"));
    },
  });
  const { control } = form;

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-6 pt-2 pb-8"
    >
      <FieldGroup className="gap-6">
        <Preview control={control} />

        {canChooseOwner && (
          <>
            <OwnerField control={control} />
            <FieldSeparator />
          </>
        )}

        <FieldSet>
          <FieldLegend>{t("Business details")}</FieldLegend>
          <LocalizedField
            control={control}
            name="name"
            label={t("Name")}
            inputLabels={{
              en: t("Name (English)"),
              ar: t("Name (Arabic)"),
            }}
            maxLength={100}
          />
          <UsernameField
            control={control}
            name="username"
            label={t("Username")}
          />
          <Controller
            control={control}
            name="category"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="category">{t("Category")}</FieldLabel>
                <CategoryPicker
                  id="category"
                  value={field.value}
                  onChange={field.onChange}
                  invalid={fieldState.invalid}
                  counts={categoryCounts}
                />
                <FormError error={fieldState.error} />
              </Field>
            )}
          />
          <LocalizedField
            control={control}
            name="bio"
            label={t("Bio")}
            inputLabels={{
              en: t("Bio (English)"),
              ar: t("Bio (Arabic)"),
            }}
            maxLength={300}
            multiline
          />
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>{t("Contact and links")}</FieldLegend>
          <LinkFields control={control} />
        </FieldSet>

        <FieldSeparator />

        <LocationFields control={control} mapsApiKey={mapsApiKey} />

        <FieldSeparator />

        <HoursFields form={form} />

        {editing && status && initial.status && (
          <>
            <FieldSeparator />
            <Controller
              control={control}
              name="status"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <StatusPanel
                    saved={initial.status!}
                    value={field.value ?? initial.status!}
                    onChange={field.onChange}
                    {...status}
                  />
                  <FormError error={fieldState.error} />
                </Field>
              )}
            />
          </>
        )}
      </FieldGroup>

      <Button
        type="submit"
        size="xl"
        className="w-full rounded-xl text-base"
        disabled={pending}
      >
        {pending && <Spinner />}
        {editing === null ? t("Create business") : t("Save changes")}
      </Button>
      {editing && deletable && (
        <DeleteBusinessButton
          username={editing}
          name={initial.name[locale] || initial.name.en}
        />
      )}
    </form>
  );
}

/** How the business will look: the category's icon as its avatar, name, @handle. */
function Preview({ control }: { control: Form }) {
  const { t, locale } = useLocale();
  const [category, name, username] = useWatch({
    control,
    name: ["category", "name", "username"],
  });
  const icon = categoryOf(category)?.icon ?? Store01Icon;
  const shownName = name[locale] || name.en;
  return (
    <div className="flex flex-col items-center gap-2 pt-2 text-center">
      <Avatar className="size-20 ring-1 ring-foreground/10">
        <AvatarFallback className="bg-primary/10 text-primary">
          <HugeiconsIcon
            icon={icon}
            strokeWidth={1.75}
            className="size-9"
            data-testid="business-avatar-icon"
            data-category={category || "none"}
          />
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span dir="auto" className="truncate font-semibold">
          {shownName || t("New business")}
        </span>
        {username && (
          <span dir="ltr" className="truncate text-sm text-muted-foreground">
            @{username}
          </span>
        )}
      </div>
    </div>
  );
}
