"use client";

import { Radio } from "@base-ui/react/radio";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Controller,
  useFieldArray,
  useFormState,
  useForm,
  useWatch,
  type Control,
  type Path,
  type UseFormReturn,
} from "react-hook-form";

import { FormError, INPUT, LocalizedField } from "@/components/form";
import {
  Copy01Icon,
  Delete02Icon,
  Gps01Icon,
  MapPinIcon,
  HugeiconsIcon,
  PlusSignIcon,
  Store01Icon,
  Tick02Icon,
  UserAdd01Icon,
  UserCheck01Icon,
} from "@/components/icons";
import { MapEmbed } from "@/components/map-embed";
import { canGoBack } from "@/components/navigation/history";
import { saveBusiness } from "@/components/profile/business-actions";
import { MapPinPicker } from "@/components/profile/map-pin-picker";
import { formatWeekday } from "@/components/profile/opening-hours";
import { ActionSheet } from "@/components/sheets/action-sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { RadioGroup } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";
import {
  businessSchema,
  formatPin,
  isNumberPlatform,
  parsePin,
  LINK_PLATFORMS,
  type LinkPlatform,
  type BusinessFormValues,
} from "@/lib/business";
import { categoryOf } from "@/lib/categories";
import { useCurrentLocation } from "@/lib/geolocation";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";
import { href } from "@/lib/routes";
import { SOCIAL_PLATFORMS } from "@/lib/socials";
import { cn } from "@/lib/utils";

import { CategoryPicker } from "./category-picker";

type Form = Control<BusinessFormValues>;

// A row of input + buttons joined together, looking like one field: the
// app's rounder ends (beats ButtonGroup's own end radius) and the inputs'
// background on the buttons too.
const JOINED =
  "w-full [&>*:first-child]:rounded-s-xl! [&>[data-slot]:not(:has(~[data-slot])):last-child]:rounded-e-xl! [&>button]:bg-input/20 dark:[&>button]:bg-input/30";

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
}: {
  initial: BusinessFormValues;
  editing: string | null;
  canChooseOwner: boolean;
  /** GOOGLE_MAPS_API_KEY: pick pins on a map (hidden without it). */
  mapsApiKey: string | null;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    defaultValues: initial,
    mode: "onTouched",
  });
  const { control } = form;

  const submit = form.handleSubmit(async (values) => {
    (document.activeElement as HTMLElement | null)?.blur();
    // Hours are kept in the owner's own zone, read from the device.
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const result = await saveBusiness(editing, {
      ...values,
      timeZone: timeZone || values.timeZone,
    });
    if (!result.ok) {
      Object.entries(result.fields ?? {}).forEach(([path, message], i) =>
        form.setError(
          path as Path<BusinessFormValues>,
          { message },
          { shouldFocus: i === 0 },
        ),
      );
      if (result.form) toast.add({ title: t(result.form), type: "error" });
      return;
    }
    toast.add({
      title: editing === null ? t("Business created") : t("Changes saved"),
    });
    if (canGoBack()) router.back();
    else router.replace(href("businesses"));
  });

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
              ar: t("Name (Arabic, optional)"),
              fr: t("Name (French, optional)"),
            }}
            maxLength={100}
          />
          <UsernameField control={control} />
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
              ar: t("Bio (Arabic, optional)"),
              fr: t("Bio (French, optional)"),
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
      </FieldGroup>

      <Button
        type="submit"
        size="xl"
        className="w-full rounded-xl text-base"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && <Spinner />}
        {editing === null ? t("Create business") : t("Save changes")}
      </Button>
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

/** Whoever adds a business says whether it's theirs (sets `ownerId`). */
function OwnerField({ control }: { control: Form }) {
  const { t } = useLocale();
  const options = [
    {
      value: "me",
      icon: UserCheck01Icon,
      title: t("It's my business"),
      description: t("You own it and manage it."),
    },
    {
      value: "someone-else",
      icon: UserAdd01Icon,
      title: t("I'm adding it for someone else"),
      description: t("You can manage it until its owner claims it."),
    },
  ];
  return (
    <Controller
      control={control}
      name="owner"
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid}>
          <FieldLegend>{t("Is this your business?")}</FieldLegend>
          <RadioGroup
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            className="grid grid-cols-2 gap-2"
          >
            {options.map((option) => (
              // Card: light border; chosen → dark border + filled check.
              <label
                key={option.value}
                className="relative flex flex-col gap-2 rounded-2xl border border-border p-3 transition-colors has-data-checked:border-foreground has-data-checked:ring-1 has-data-checked:ring-foreground"
              >
                <Radio.Root
                  value={option.value}
                  className="group/radio absolute end-3 top-3 flex size-6 items-center justify-center rounded-full border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring/30 data-checked:border-foreground data-checked:bg-foreground"
                >
                  <Radio.Indicator className="flex text-background">
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      strokeWidth={3}
                      className="size-3.5"
                    />
                  </Radio.Indicator>
                </Radio.Root>
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-foreground">
                  <HugeiconsIcon
                    icon={option.icon}
                    strokeWidth={2}
                    className="size-5"
                  />
                </span>
                <span className="text-sm font-semibold leading-snug">
                  {option.title}
                </span>
                <span className="text-xs leading-normal text-muted-foreground">
                  {option.description}
                </span>
              </label>
            ))}
          </RadioGroup>
          <FormError error={fieldState.error} />
        </FieldSet>
      )}
    />
  );
}

function UsernameField({ control }: { control: Form }) {
  const { t } = useLocale();
  return (
    <Controller
      control={control}
      name="username"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="username">{t("Username")}</FieldLabel>
          <InputGroup dir="ltr" className="h-11 rounded-xl">
            <InputGroupAddon className="ps-3 text-base">@</InputGroupAddon>
            <InputGroupInput
              {...field}
              onChange={(event) =>
                field.onChange(event.target.value.toLowerCase())
              }
              id="username"
              aria-invalid={fieldState.invalid}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              enterKeyHint="next"
              maxLength={30}
              className="h-full text-base md:text-base"
            />
          </InputGroup>
          <FormError error={fieldState.error} />
        </Field>
      )}
    />
  );
}

/** The "remove this row" end of a joined row. */
function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className="size-11 shrink-0 text-muted-foreground"
    >
      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-5" />
    </Button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="xl"
      onClick={onClick}
      className="w-full rounded-xl text-sm"
    >
      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
      {label}
    </Button>
  );
}

// What each kind of entry types: a number (WhatsApp, phone) or a web link.
const NUMBER_INPUT = {
  type: "tel",
  inputMode: "tel",
  autoComplete: "tel",
  placeholder: "+20 100 123 4567",
} as const;
const LINK_INPUT = {
  type: "url",
  inputMode: "url",
  autoComplete: "url",
  placeholder: "instagram.com/yourname",
} as const;

/**
 * WhatsApp, phone numbers, website and social accounts — one list, one
 * line each: the kind's icon (tap to change it), the number or link, and
 * remove. At least one WhatsApp (customers order there).
 */
function LinkFields({ control }: { control: Form }) {
  const { t } = useLocale();
  const { fields, append, remove } = useFieldArray({ control, name: "links" });
  const { errors } = useFormState({ control, name: "links" });
  const listError = errors.links?.root ?? errors.links;
  const platformName = (platform: LinkPlatform) =>
    platform === "website"
      ? t("Website")
      : platform === "phone"
        ? t("Phone number")
        : SOCIAL_PLATFORMS[platform].name;
  return (
    <>
      <FieldDescription>
        {t("WhatsApp is required: customers order there.")}
      </FieldDescription>
      {fields.map((item, index) => (
        <Controller
          key={item.id}
          control={control}
          name={`links.${index}.url`}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Controller
                control={control}
                name={`links.${index}.platform`}
                render={({ field: platform }) => (
                  <ButtonGroup dir="ltr" className={JOINED}>
                    <PlatformButton
                      value={platform.value}
                      onChange={platform.onChange}
                      label={`${t("Link {{n}}: type", { n: index + 1 })} — ${platformName(platform.value)}`}
                      platformName={platformName}
                    />
                    <Input
                      {...field}
                      {...(isNumberPlatform(platform.value)
                        ? NUMBER_INPUT
                        : LINK_INPUT)}
                      aria-label={t("Link {{n}}: address", { n: index + 1 })}
                      data-invalid={fieldState.invalid}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="next"
                      className={INPUT}
                    />
                    <RemoveButton
                      label={t("Remove link {{n}}", { n: index + 1 })}
                      onClick={() => remove(index)}
                    />
                  </ButtonGroup>
                )}
              />
              <FormError error={fieldState.error} />
            </Field>
          )}
        />
      ))}
      {typeof listError?.message === "string" && (
        <FieldError>{t(listError.message as MessageKey)}</FieldError>
      )}
      {fields.length < 15 && (
        <AddButton
          label={t("Add a link")}
          onClick={() =>
            append({
              // The first one is WhatsApp until there is one.
              platform: fields.some((f) => f.platform === "whatsapp")
                ? "phone"
                : "whatsapp",
              url: "",
            })
          }
        />
      )}
    </>
  );
}

/** The kind's icon in its brand colours; opens a sheet to change it. */
function PlatformButton({
  value,
  onChange,
  label,
  platformName,
}: {
  value: LinkPlatform;
  onChange: (value: LinkPlatform) => void;
  label: string;
  platformName: (platform: LinkPlatform) => string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const { icon, colors } = SOCIAL_PLATFORMS[value];
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={label}
        onClick={() => setOpen(true)}
        className="size-11 shrink-0"
      >
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full",
            colors,
          )}
        >
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
        </span>
      </Button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title={t("Link type")}
        actions={LINK_PLATFORMS.map((platform) => ({
          label: platformName(platform),
          icon: SOCIAL_PLATFORMS[platform].icon,
          iconColors: SOCIAL_PLATFORMS[platform].colors,
          onSelect: () => onChange(platform),
        }))}
      />
    </>
  );
}

/** Branches (at least one): the address in each language + the map pin. */
function LocationFields({
  control,
  mapsApiKey,
}: {
  control: Form;
  mapsApiKey: string | null;
}) {
  const { t } = useLocale();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "locations",
  });
  return (
    <FieldSet>
      <FieldLegend>{t("Branches")}</FieldLegend>
      {fields.map((item, index) => (
        <FieldSet
          key={item.id}
          className="gap-4 rounded-2xl border p-3"
          aria-label={t("Branch {{n}}", { n: index + 1 })}
        >
          <LocalizedField
            control={control}
            name={`locations.${index}.address`}
            label={t("Address")}
            inputLabels={{
              en: t("Address (English)"),
              ar: t("Address (Arabic, optional)"),
              fr: t("Address (French, optional)"),
            }}
            maxLength={200}
            action={
              fields.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={t("Remove branch {{n}}", { n: index + 1 })}
                  onClick={() => remove(index)}
                  className="size-11 shrink-0 rounded-xl bg-input/20 text-muted-foreground dark:bg-input/30"
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    strokeWidth={2}
                    className="size-5"
                  />
                </Button>
              )
            }
          />
          <PinField control={control} index={index} mapsApiKey={mapsApiKey} />
        </FieldSet>
      ))}
      {fields.length < 20 && (
        <AddButton
          label={t("Add a branch")}
          onClick={() =>
            append(
              { address: { en: "", ar: "", fr: "" }, pin: "" },
              { shouldFocus: false },
            )
          }
        />
      )}
    </FieldSet>
  );
}

/**
 * Where the branch is, shown on a map (people don't think in latitude /
 * longitude). Tapping the map picks it on Google Maps (where it can also
 * be removed) — or, without a Maps key, uses the phone's current location.
 */
function PinField({
  control,
  index,
  mapsApiKey,
}: {
  control: Form;
  index: number;
  mapsApiKey: string | null;
}) {
  const { t, locale } = useLocale();
  const { locate, locating } = useCurrentLocation();
  const [picking, setPicking] = useState(false);
  return (
    <Controller
      control={control}
      name={`locations.${index}.pin`}
      render={({ field, fieldState }) => {
        const pin = parsePin(field.value);
        const set = (coords: { lat: number; lng: number }) => {
          field.onChange(formatPin(coords));
          field.onBlur();
        };
        const edit = () => (mapsApiKey ? setPicking(true) : locate(set));
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldTitle className=" sr-only">
              {t("Location on the map")}
            </FieldTitle>
            {pin ? (
              <button
                type="button"
                onClick={edit}
                aria-label={t("Edit the location")}
                className="block h-36 overflow-hidden rounded-xl border bg-muted"
              >
                <MapEmbed
                  location={pin}
                  label={t("Location on the map")}
                  locale={locale}
                />
              </button>
            ) : (
              <button
                type="button"
                ref={field.ref}
                onClick={edit}
                disabled={locating}
                data-invalid={fieldState.invalid}
                className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-input/20 text-sm font-medium text-muted-foreground data-[invalid=true]:border-destructive dark:bg-input/30"
              >
                {locating ? (
                  <Spinner className="size-6" />
                ) : (
                  <HugeiconsIcon
                    icon={mapsApiKey ? MapPinIcon : Gps01Icon}
                    strokeWidth={2}
                    className="size-6"
                  />
                )}
                {mapsApiKey
                  ? t("Set the location on the map")
                  : t("Use my current location")}
              </button>
            )}
            <FormError error={fieldState.error} />
            {mapsApiKey && (
              <MapPinPicker
                apiKey={mapsApiKey}
                open={picking}
                onOpenChange={setPicking}
                initial={pin}
                onPick={set}
                onRemove={() => field.onChange("")}
              />
            )}
          </Field>
        );
      }}
    />
  );
}

/**
 * The week (Sunday first) as one card: per day a switch, then the opening
 * and closing times joined, a "24h" toggle and "copy to every day".
 */
function HoursFields({ form }: { form: UseFormReturn<BusinessFormValues> }) {
  const { t, locale } = useLocale();
  const { control, setValue, getValues } = form;

  const copyToAll = (day: number) => {
    const slot = getValues(`hours.${day}`);
    for (let other = 0; other < 7; other++) {
      if (other !== day)
        setValue(
          `hours.${other}`,
          { ...slot },
          { shouldDirty: true, shouldValidate: true },
        );
    }
    toast.add({ title: t("Hours copied to every day"), type: "success" });
  };

  return (
    <FieldSet>
      <FieldLegend>{t("Working hours")}</FieldLegend>
      <div className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
        <div
          aria-hidden
          className={cn(DAY_ROW, "py-1.5 text-xs text-muted-foreground")}
        >
          <span />
          <span className="col-span-2 flex" dir="ltr">
            <span className="flex-1 text-center">{t("From")}</span>
            <span className="flex-1 text-center">{t("To")}</span>
          </span>
        </div>
        {Array.from({ length: 7 }, (_, day) => (
          <DayHours
            key={day}
            control={control}
            day={day}
            weekday={formatWeekday(day, locale)}
            shortWeekday={formatWeekday(day, locale, "short")}
            onCopyToAll={() => copyToAll(day)}
          />
        ))}
      </div>
      <FieldDescription>
        {t("Closing at 00:00 means midnight; 00:00 to 00:00 is open all day.")}
      </FieldDescription>
    </FieldSet>
  );
}

/** Day | from | to | 24h · copy · switch — shared by the header and every day. */
const DAY_ROW =
  "grid grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-1.5 px-3";

function DayHours({
  control,
  day,
  weekday,
  shortWeekday,
  onCopyToAll,
}: {
  control: Form;
  day: number;
  weekday: string;
  shortWeekday: string;
  onCopyToAll: () => void;
}) {
  const { t } = useLocale();
  const [open, from, to] = useWatch({
    control,
    name: [`hours.${day}.open`, `hours.${day}.from`, `hours.${day}.to`],
  });
  const allDay = open && from === "00:00" && to === "00:00";
  return (
    <div className="flex flex-col gap-1 py-2">
      {/* The whole day on one line. */}
      <div className={DAY_ROW}>
        <FieldLabel htmlFor={`hours-${day}`} className="truncate text-sm">
          <span aria-hidden>{shortWeekday}</span>
          <span className="sr-only">{weekday}</span>
        </FieldLabel>
        {!open ? (
          <span className="col-span-2 text-center text-sm text-muted-foreground">
            {t("Closed")}
          </span>
        ) : allDay ? (
          <span className="col-span-2 text-center text-sm text-muted-foreground">
            {t("Open 24 hours")}
          </span>
        ) : (
          <ButtonGroup dir="ltr" className={cn(JOINED, "col-span-2")}>
            <TimeInput
              control={control}
              day={day}
              end="from"
              weekday={weekday}
            />
            <TimeInput control={control} day={day} end="to" weekday={weekday} />
          </ButtonGroup>
        )}
        <div className="flex items-center">
          <Controller
            control={control}
            name={`hours.${day}`}
            render={({ field: slot }) => (
              <Toggle
                pressed={allDay}
                disabled={!open}
                aria-label={t("Open 24 hours on {{day}}", { day: weekday })}
                onPressedChange={(pressed) =>
                  slot.onChange(
                    pressed
                      ? { open: true, from: "00:00", to: "00:00" }
                      : { open: true, from: "09:00", to: "21:00" },
                  )
                }
                className="h-11 rounded-xl px-1.5 text-xs font-semibold"
              >
                24h
              </Toggle>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("Copy {{day}}'s hours to every day", {
              day: weekday,
            })}
            onClick={onCopyToAll}
            className="size-11 rounded-xl text-muted-foreground"
          >
            <HugeiconsIcon
              icon={Copy01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </Button>
          <Controller
            control={control}
            name={`hours.${day}.open`}
            render={({ field }) => (
              <Switch
                id={`hours-${day}`}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </div>
      {open && (
        <div className="px-3">
          <Controller
            control={control}
            name={`hours.${day}.from`}
            render={({ fieldState }) => <FormError error={fieldState.error} />}
          />
          <Controller
            control={control}
            name={`hours.${day}.to`}
            render={({ fieldState }) => <FormError error={fieldState.error} />}
          />
        </div>
      )}
    </div>
  );
}

function TimeInput({
  control,
  day,
  end,
  weekday,
}: {
  control: Form;
  day: number;
  end: "from" | "to";
  weekday: string;
}) {
  const { t } = useLocale();
  return (
    <Controller
      control={control}
      name={`hours.${day}.${end}`}
      render={({ field, fieldState }) => (
        <Input
          {...field}
          type="time"
          aria-label={
            end === "from"
              ? t("Opens on {{day}}", { day: weekday })
              : t("Closes on {{day}}", { day: weekday })
          }
          aria-invalid={fieldState.invalid}
          className="h-11 min-w-0 flex-1 px-1 text-center text-base md:text-base"
        />
      )}
    />
  );
}
