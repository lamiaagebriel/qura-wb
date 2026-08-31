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
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  LocationEditor,
  PhonesEditor,
  SocialLinksEditor,
} from "@/components/location-editor";
import { WorkingHoursEditor } from "@/components/working-hours-editor";
import { createBusinessAction } from "@/lib/business/actions/create";
import { deleteBusinessAction } from "@/lib/business/actions/delete";
import { updateBusinessAction } from "@/lib/business/actions/update";
import {
  clearBusinessBlockAction,
  upsertBusinessBlockAction,
} from "@/lib/business/actions/upsert-block";
import { BUSINESS_CATEGORIES, type BusinessCategory } from "@/db/schema";
import { CATEGORY_META } from "@/lib/categories";
import { handleAppError } from "@/lib/errors-client";
import {
  EMPTY_LOCATION,
  type Location,
  type LocationFormValues,
} from "@/lib/location";
import { setActiveProfile } from "@/lib/identity/actions";
import { useLocale } from "@/lib/i18n/client";
import {
  createBusinessSchema,
  type BusinessValues,
} from "@/lib/validations/business";
import {
  RESTAURANT_PRICE_RANGES,
  type BusinessBlockValues,
} from "@/lib/validations/business-block";
import { createZodResolver } from "@/lib/validations/resolver";
import { EMPTY_WORKING_HOURS, type WorkingHours } from "@/lib/working-hours";

// Every field across every category, all optional here — the block form
// has no zod resolver (unlike the business-profile form above it), so
// this is deliberately loose; `upsertBusinessBlockAction` re-validates
// strictly against whichever category-specific schema actually applies
// once submitted, and reports back per-field errors the same way any
// other action does. Keeping client-side validation out of it avoids
// building (and keeping in sync) a second resolver that swaps schemas
// every time `category` changes.
type BlockFormValues = {
  cuisine: string;
  priceRange: (typeof RESTAURANT_PRICE_RANGES)[number] | "";
  workingHours: WorkingHours;
  deliveryAvailable: boolean;
  reservationsAvailable: boolean;
  menuUrl: string;
  specialty: string;
  clinicAddress: string;
  acceptsInsurance: boolean;
  appointmentPhone: string;
  consultationFee: string;
  details: string;
  location: LocationFormValues;
  phones: string[];
  socialLinks: string[];
};

const EMPTY_BLOCK_VALUES: BlockFormValues = {
  cuisine: "",
  priceRange: "",
  workingHours: EMPTY_WORKING_HOURS,
  deliveryAvailable: false,
  reservationsAvailable: false,
  menuUrl: "",
  specialty: "",
  clinicAddress: "",
  acceptsInsurance: false,
  appointmentPhone: "",
  consultationFee: "",
  details: "",
  location: EMPTY_LOCATION,
  phones: [],
  socialLinks: [],
};

/** `LocationFormValues` (loose, form-only) → the real `Location`
 * `upsertBusinessBlockAction` validates against — `undefined` when the
 * description is empty (no location set at all); lat/lng only come
 * along when *both* are present and parse, otherwise they're dropped
 * (a half-filled coordinate pair is worse than none). */
function toLocationPayload(value: LocationFormValues): Location | undefined {
  const description = value.description.trim();
  if (!description) return undefined;

  const lat = Number(value.lat);
  const lng = Number(value.lng);
  const hasCoords =
    value.lat !== "" &&
    value.lng !== "" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng);

  return {
    description,
    ...(hasCoords ? { lat, lng } : {}),
  };
}

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
 * setting the *new* business active on create success below.
 *
 * The category block (restaurant/doctor-specific fields) saves through
 * a completely separate table (`business_blocks`) and action, but reads
 * as one form/one Save button — both submits happen back to back inside
 * `onSubmit`, and only navigate away once both succeed.
 */
export function BusinessProfileForm({
  mode,
  businessId,
  defaultValues,
  initialCategory,
  initialBlockValues,
}: {
  mode: "create" | "edit";
  businessId?: string;
  defaultValues: BusinessValues;
  initialCategory?: BusinessCategory | null;
  initialBlockValues?: Partial<BlockFormValues>;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [category, setCategory] = useState<BusinessCategory | "">(
    initialCategory ?? "",
  );
  const schema = useMemo(() => createBusinessSchema(t), [t]);

  const form = useForm<BusinessValues>({
    resolver: createZodResolver(schema),
    defaultValues,
  });
  const blockForm = useForm<BlockFormValues>({
    defaultValues: { ...EMPTY_BLOCK_VALUES, ...initialBlockValues },
  });

  async function saveBlock(id: string) {
    if (!category) {
      // Nothing to clear if there was never a block — skip the extra
      // round trip rather than deleting a row that doesn't exist.
      if (initialCategory) {
        const result = await clearBusinessBlockAction(id);
        if (!result.success) {
          handleAppError(result.error);
          return false;
        }
      }
      return true;
    }

    const values = blockForm.getValues();
    const location = toLocationPayload(values.location);
    const phones = values.phones.filter((p) => p.trim() !== "");
    const socialLinks = values.socialLinks.filter((l) => l.trim() !== "");
    const shared = {
      location,
      phones: phones.length > 0 ? phones : undefined,
      socialLinks: socialLinks.length > 0 ? socialLinks : undefined,
    };
    const payload: BusinessBlockValues =
      category === "food-drinks"
        ? {
            category: "food-drinks",
            cuisine: values.cuisine,
            priceRange: values.priceRange || undefined,
            workingHours: values.workingHours,
            deliveryAvailable: values.deliveryAvailable,
            reservationsAvailable: values.reservationsAvailable,
            menuUrl: values.menuUrl,
            ...shared,
          }
        : category === "health"
          ? {
              category: "health",
              specialty: values.specialty,
              clinicAddress: values.clinicAddress || undefined,
              workingHours: values.workingHours,
              acceptsInsurance: values.acceptsInsurance,
              appointmentPhone: values.appointmentPhone || undefined,
              consultationFee: values.consultationFee || undefined,
              ...shared,
            }
          : {
              category,
              details: values.details || undefined,
              ...shared,
            };

    const result = await upsertBusinessBlockAction(id, payload);
    if (!result.success) {
      handleAppError(result.error, blockForm);
      return false;
    }
    return true;
  }

  async function onSubmit(values: BusinessValues) {
    // Kept as two full branches (not one shared `result` from a ternary)
    // so TS narrows each action's return type on its own —
    // `createBusinessAction`'s `data` is `{id, username}`,
    // `updateBusinessAction`'s is always `undefined`; a shared variable
    // would union the two and lose that.
    let id: string;
    if (mode === "create") {
      const result = await createBusinessAction(values);
      if (!result.success) {
        handleAppError(result.error, form);
        return;
      }
      id = result.data.id;
    } else {
      const result = await updateBusinessAction(businessId!, values);
      if (!result.success) {
        handleAppError(result.error, form);
        return;
      }
      id = businessId!;
    }

    if (!(await saveBlock(id))) return;

    if (mode === "create") {
      // You just created it via "Add a business profile" — switch
      // straight into it rather than leaving the switcher on whatever
      // was active before, so posting/browsing as it starts immediately.
      await setActiveProfile(id);
      toast.success(t("Business profile created."));
    } else {
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
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

          <FieldSeparator>{t("Business type")}</FieldSeparator>

          <Field>
            <FieldLabel htmlFor="category">{t("Category")}</FieldLabel>
            <Select
              value={category || "none"}
              onValueChange={(v) =>
                setCategory(v === "none" ? "" : (v as BusinessCategory))
              }
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("None")}</SelectItem>
                {BUSINESS_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(CATEGORY_META[c].label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {!!category && (
            <>
              <FieldSeparator>{t("Location & contact")}</FieldSeparator>
              <Controller
                name="location"
                control={blockForm.control}
                render={({ field }) => (
                  <LocationEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="phones"
                control={blockForm.control}
                render={({ field }) => (
                  <PhonesEditor value={field.value} onChange={field.onChange} />
                )}
              />
              <Controller
                name="socialLinks"
                control={blockForm.control}
                render={({ field }) => (
                  <SocialLinksEditor
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </>
          )}

          {category === "food-drinks" && (
            <>
              <Controller
                name="cuisine"
                control={blockForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t("Cuisine")}</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="priceRange"
                control={blockForm.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="priceRange">
                      {t("Price range")}
                    </FieldLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger id="priceRange">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t("Not set")}</SelectItem>
                        {RESTAURANT_PRICE_RANGES.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Controller
                name="workingHours"
                control={blockForm.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>{t("Working hours")}</FieldLabel>
                    <WorkingHoursEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </Field>
                )}
              />
              <Controller
                name="menuUrl"
                control={blockForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      {t("Menu URL")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="deliveryAvailable"
                control={blockForm.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor={field.name}>
                      {t("Delivery available")}
                    </FieldLabel>
                    <Switch
                      id={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Field>
                )}
              />
              <Controller
                name="reservationsAvailable"
                control={blockForm.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor={field.name}>
                      {t("Reservations available")}
                    </FieldLabel>
                    <Switch
                      id={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Field>
                )}
              />
            </>
          )}

          {category === "health" && (
            <>
              <Controller
                name="specialty"
                control={blockForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      {t("Specialty")}
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="clinicAddress"
                control={blockForm.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("Clinic address")}
                    </FieldLabel>
                    <Input {...field} id={field.name} />
                  </Field>
                )}
              />
              <Controller
                name="workingHours"
                control={blockForm.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel>{t("Working hours")}</FieldLabel>
                    <WorkingHoursEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </Field>
                )}
              />
              <Controller
                name="appointmentPhone"
                control={blockForm.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("Appointment phone")}
                    </FieldLabel>
                    <Input {...field} id={field.name} />
                  </Field>
                )}
              />
              <Controller
                name="consultationFee"
                control={blockForm.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t("Consultation fee")}
                    </FieldLabel>
                    <Input {...field} id={field.name} />
                  </Field>
                )}
              />
              <Controller
                name="acceptsInsurance"
                control={blockForm.control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor={field.name}>
                      {t("Accepts insurance")}
                    </FieldLabel>
                    <Switch
                      id={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </Field>
                )}
              />
            </>
          )}

          {!!category &&
            category !== "food-drinks" &&
            category !== "health" && (
              <Controller
                name="details"
                control={blockForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t("Details")}</FieldLabel>
                    <Textarea {...field} id={field.name} maxLength={300} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}

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
