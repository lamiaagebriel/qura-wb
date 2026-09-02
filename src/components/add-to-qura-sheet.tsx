"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  checkGooglePlaceConversionAction,
  createBusinessFromGooglePlaceAction,
} from "@/lib/business/actions/create-from-google-place";
import { mapGoogleTypesToQuraCategories } from "@/lib/business/google-category-mapping";
import { BUSINESS_CATEGORIES, type BusinessCategory, type CityId } from "@/db/schema";
import { CATEGORY_META } from "@/lib/categories";
import { CITY_LABEL, CITY_ORDER } from "@/lib/city/cities";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";

type GooglePlaceInput = {
  placeId: string;
  name: string;
  address?: string | null;
  location?: { latitude: number; longitude: number } | null;
  types: string[];
};

type Step = "preview" | "form" | "success";

/**
 * "Add to Qura" — the one affordance a `kind: "google"`/`source:
 * "google"` result gets, shared by both `search-view.tsx` and
 * `category-results.tsx` rather than duplicated per page. Mirrors
 * `google-place-connection.tsx`'s Sheet/step pattern, but this flow
 * creates a brand-new business rather than connecting an existing one.
 *
 * The same-user dedup check can't run before this button is even shown
 * (the result may be rendered for a signed-out visitor) — it runs at
 * click time instead, and only opens the sheet if it comes back clear.
 */
export function AddToQuraSheet({
  googlePlace,
  activeCity,
}: {
  googlePlace: GooglePlaceInput;
  activeCity: CityId;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("preview");
  const [isChecking, startChecking] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();

  const suggested = mapGoogleTypesToQuraCategories(googlePlace.types);

  const [name, setName] = useState(googlePlace.name);
  const [username, setUsername] = useState("");
  const [address, setAddress] = useState(googlePlace.address ?? "");
  const [category, setCategory] = useState<BusinessCategory | "">(
    suggested[0] ?? "",
  );
  const [city, setCity] = useState<CityId>(activeCity);
  const [conflict, setConflict] = useState(false);
  const [createdUsername, setCreatedUsername] = useState("");

  const handleOpenClick = () => {
    startChecking(async () => {
      const result = await checkGooglePlaceConversionAction(googlePlace.placeId);
      if (!result.success) {
        handleAppError(result.error);
        return;
      }
      if (result.data.existing) {
        router.push(`/profile/${result.data.existing.username}`);
        return;
      }
      setStep("preview");
      setOpen(true);
    });
  };

  const handleCreate = () => {
    if (!category) return;
    startSubmitting(async () => {
      const result = await createBusinessFromGooglePlaceAction({
        googlePlace: {
          placeId: googlePlace.placeId,
          name: googlePlace.name,
          address: address || undefined,
          location: googlePlace.location ?? undefined,
          types: googlePlace.types,
        },
        name,
        username,
        category,
        city,
      });
      if (!result.success) {
        handleAppError(result.error);
        return;
      }
      if (result.data.status === "already_connected") {
        router.push(`/profile/${result.data.username}`);
        return;
      }
      setConflict(result.data.conflict);
      setCreatedUsername(result.data.username);
      setStep("success");
      router.refresh();
    });
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && step === "success") router.push(`/profile/${createdUsername}`);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isChecking}
        onClick={handleOpenClick}
      >
        {t("Add to Qura")}
      </Button>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          {step === "preview" && (
            <>
              <SheetHeader>
                <SheetTitle>{googlePlace.name}</SheetTitle>
                {googlePlace.address && (
                  <SheetDescription>{googlePlace.address}</SheetDescription>
                )}
              </SheetHeader>
              <div className="px-6 pb-2">
                <p className="text-muted-foreground text-[13px]">
                  {t(
                    "This creates a new Qura profile connected to this Google Place. It doesn't verify that you own or manage the real business.",
                  )}
                </p>
              </div>
              <SheetFooter>
                <Button type="button" onClick={() => setStep("form")}>
                  {t("Continue")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  {t("Cancel")}
                </Button>
              </SheetFooter>
            </>
          )}

          {step === "form" && (
            <>
              <SheetHeader>
                <SheetTitle>{t("Add to Qura")}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-6">
                <Field>
                  <FieldLabel htmlFor="atq-name">{t("Business name")}</FieldLabel>
                  <Input
                    id="atq-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="atq-username">{t("Username")}</FieldLabel>
                  <Input
                    id="atq-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="atq-address">{t("Address")}</FieldLabel>
                  <Input
                    id="atq-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="atq-category">{t("Category")}</FieldLabel>
                  <Select
                    value={category || undefined}
                    onValueChange={(v) => setCategory(v as BusinessCategory)}
                  >
                    <SelectTrigger id="atq-category">
                      <SelectValue placeholder={t("Choose a category.")} />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {t(CATEGORY_META[c].label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="atq-city">{t("City")}</FieldLabel>
                  <Select value={city} onValueChange={(v) => setCity(v as CityId)}>
                    <SelectTrigger id="atq-city">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CITY_ORDER.map((c) => (
                        <SelectItem key={c} value={c}>
                          {t(CITY_LABEL[c])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <SheetFooter>
                <Button
                  type="button"
                  disabled={isSubmitting || !name || !username || !category}
                  onClick={handleCreate}
                >
                  {t("Add to Qura")}
                </Button>
                <Button type="button" variant="outline" onClick={() => setStep("preview")}>
                  {t("Back")}
                </Button>
              </SheetFooter>
            </>
          )}

          {step === "success" && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="size-5 text-emerald-600"
                  />
                  <SheetTitle>{t("Add to Qura")}</SheetTitle>
                </div>
                <SheetDescription>
                  {conflict
                    ? t(
                        "This Google Place is also connected to another Qura business profile. Our team has been notified for review.",
                      )
                    : t("Your Qura profile is connected to this Google Place.")}
                </SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <Button type="button" onClick={() => handleOpenChange(false)}>
                  {t("Done")}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export type { GooglePlaceInput as AddToQuraGooglePlace };
