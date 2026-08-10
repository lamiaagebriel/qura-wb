"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createBusinessAction } from "@/lib/business/actions/create";
import { deleteBusinessAction } from "@/lib/business/actions/delete";
import { updateBusinessAction } from "@/lib/business/actions/update";
import { handleAppError } from "@/lib/errors-client";
import { setActiveProfile } from "@/lib/identity/actions";
import { useLocale } from "@/lib/i18n/client";
import {
  createBusinessSchema,
  type BusinessValues,
} from "@/lib/validations/business";
import { createZodResolver } from "@/lib/validations/resolver";

/** Create and edit are the same form against the same fields as
 * `EditProfileForm` — a business profile is "exactly like the user
 * profile in everything", starting with how you fill it out. Only the
 * action it submits to (and where it lands afterward) differs by mode.
 *
 * Which mode this renders in isn't a route param — `/account/business`
 * is a single page whose mode follows the *active identity*
 * (`getActiveIdentity()`, in the server component that renders this):
 * editing your currently-active business if you're viewing as one,
 * otherwise creating a new one. Switching to "create" for real (as
 * opposed to editing whatever's active) is `ProfileSwitcher`'s job — it
 * clears the active identity before linking here, same as this form
 * setting the *new* business active on create success below. */
export function BusinessProfileForm({
  mode,
  businessId,
  defaultValues,
}: {
  mode: "create" | "edit";
  businessId?: string;
  defaultValues: BusinessValues;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const schema = useMemo(() => createBusinessSchema(t), [t]);

  const form = useForm<BusinessValues>({
    resolver: createZodResolver(schema),
    defaultValues,
  });

  async function onSubmit(values: BusinessValues) {
    // Kept as two full branches (not one shared `result` from a ternary)
    // so TS narrows each action's return type on its own —
    // `createBusinessAction`'s `data` is `{id, username}`,
    // `updateBusinessAction`'s is always `undefined`; a shared variable
    // would union the two and lose that.
    if (mode === "create") {
      const result = await createBusinessAction(values);
      if (!result.success) {
        handleAppError(result.error, form);
        return;
      }
      // You just created it via "Add a business profile" — switch
      // straight into it rather than leaving the switcher on whatever
      // was active before, so posting/browsing as it starts immediately.
      await setActiveProfile(result.data.id);
      toast.success(t("Business profile created."));
    } else {
      const result = await updateBusinessAction(businessId!, values);
      if (!result.success) {
        handleAppError(result.error, form);
        return;
      }
      toast.success(t("Business profile updated."));
    }
    router.push("/account");
    router.refresh();
  }

  async function handleDelete() {
    setConfirmDelete(false);
    setIsDeleting(true);
    const result = await deleteBusinessAction(businessId!);
    if (!result.success) {
      setIsDeleting(false);
      handleAppError(result.error);
      return;
    }
    await setActiveProfile(null);
    toast.success(t("Business profile deleted."));
    router.push("/account");
    router.refresh();
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {t("Business name")}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                />
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
                    {field.value?.length ?? 0}/150
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

          {mode === "edit" && (
            <Field>
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                disabled={isDeleting}
                onClick={() => setConfirmDelete(true)}
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                {t("Delete business profile")}
              </Button>
            </Field>
          )}
        </FieldGroup>
      </form>

      {mode === "edit" && (
        <Sheet open={confirmDelete} onOpenChange={setConfirmDelete}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{t("Delete this business profile?")}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 px-4 pb-6">
              <p className="text-muted-foreground -mt-2 mb-1 text-[13px] leading-relaxed">
                {t(
                  "This will permanently delete this business profile and everything it posted.",
                )}
              </p>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {t("Delete")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
              >
                {t("Cancel")}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
