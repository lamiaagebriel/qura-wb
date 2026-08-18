import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Call02Icon, MapsLocation01Icon } from "@hugeicons/core-free-icons";

import { CATEGORY_META } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Dict } from "@/lib/i18n/config";
import type { BusinessCategory } from "@/db/schema";
import {
  googleMapsEmbedUrl,
  googleMapsUrl,
  type Location,
} from "@/lib/location";
import { detectSocialPlatform } from "@/lib/social";
import { formatWorkingHours, type WorkingHours } from "@/lib/working-hours";
import { buttonVariants } from "./ui/button";

type Translate = (key: keyof Dict) => string;

type Fact = { label: string; value: ReactNode };

/** A single "Call" button when there's one number; a native `<details>`
 * disclosure — no JS, no custom dialog/sheet component — listing each
 * one as its own `tel:` link when there's more than one. `<summary>`
 * already gets a native disclosure triangle and click handling for
 * free, which is exactly the "pick one of several" behavior asked for. */
function CallButton({ phones, t }: { phones: string[]; t: Translate }) {
  if (phones.length === 1) {
    return (
      <a
        href={`tel:${phones[0]}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
      >
        <HugeiconsIcon icon={Call02Icon} className="size-3.5" />
        {t("Call")}
      </a>
    );
  }

  return (
    <details className="relative">
      <summary
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "list-none gap-1.5 [&::-webkit-details-marker]:hidden",
        )}
      >
        <HugeiconsIcon icon={Call02Icon} className="size-3.5" />
        {t("Call")}
      </summary>
      <div className="border-border bg-popover absolute start-0 top-full z-10 mt-1 flex min-w-40 flex-col overflow-hidden rounded-md border py-1 shadow-md">
        {phones.map((phone, index) => (
          <a
            key={index}
            href={`tel:${phone}`}
            dir="ltr"
            className="text-foreground hover:bg-muted px-3 py-1.5 text-[12.5px]"
          >
            {phone}
          </a>
        ))}
      </div>
    </details>
  );
}

/** The category-specific info block on a business's public profile —
 * reads straight off `business_blocks.data` (loosely typed, same as the
 * form that writes it: the real shape guarantee comes from
 * `upsertBusinessBlockAction`'s zod schema at write time, not from a
 * type here). A table of label/value facts plus a day-by-day hours
 * table — only `food-drinks`/`health` have bespoke facts; every other
 * category falls back to its category icon/label plus the generic
 * `details` blurb. Location (description + map) is always the last
 * section, right above the embedded map it belongs to. Renders nothing
 * for a business with no category set. */
export function BusinessBlockCard({
  category,
  data,
  t,
}: {
  category: BusinessCategory | null | undefined;
  data: Record<string, unknown> | null | undefined;
  t: Translate;
}) {
  if (!category || !data) return null;
  const meta = CATEGORY_META[category];

  const location = data.location as Location | undefined;
  const phones = data.phones as string[] | undefined;
  const socialLinks = data.socialLinks as string[] | undefined;
  const mapsUrl = location ? googleMapsUrl(location) : null;
  const mapsEmbedUrl = location ? googleMapsEmbedUrl(location) : null;

  const facts: Fact[] =
    category === "food-drinks"
      ? (
          [
            data.priceRange
              ? { label: t("Price range"), value: String(data.priceRange) }
              : null,
            data.deliveryAvailable
              ? { label: t("Delivery"), value: t("Available") }
              : null,
            data.reservationsAvailable
              ? { label: t("Reservations"), value: t("Available") }
              : null,
          ] as (Fact | null)[]
        ).filter((f): f is Fact => f !== null)
      : category === "health"
        ? (
            [
              data.clinicAddress
                ? {
                    label: t("Clinic address"),
                    value: String(data.clinicAddress),
                  }
                : null,
              data.appointmentPhone
                ? {
                    label: t("Appointment phone"),
                    value: String(data.appointmentPhone),
                  }
                : null,
              data.consultationFee
                ? {
                    label: t("Consultation fee"),
                    value: String(data.consultationFee),
                  }
                : null,
              data.acceptsInsurance
                ? { label: t("Insurance"), value: t("Accepted") }
                : null,
            ] as (Fact | null)[]
          ).filter((f): f is Fact => f !== null)
        : [];

  const hours = formatWorkingHours(
    data.workingHours as WorkingHours | undefined,
    t,
  );
  const headerLabel =
    category === "food-drinks"
      ? String(data.cuisine ?? t(meta.label))
      : category === "health"
        ? String(data.specialty ?? t(meta.label))
        : t(meta.label);
  const details = typeof data.details === "string" ? data.details : "";

  return (
    <div className="divide-border/50 flex flex-col divide-y overflow-hidden">
      <div className="bg-muted/80">
        <div className="container flex items-center gap-2 py-2.5">
          <HugeiconsIcon icon={meta.icon} className="text-primary size-4" />
          <span className="text-foreground text-[13px] font-semibold">
            {headerLabel}
          </span>
        </div>
      </div>

      {details && (
        <div className="container flex flex-col gap-1.5 py-2.5">
          <p className="text-muted-foreground text-[12.5px] leading-relaxed whitespace-pre-line">
            {details}
          </p>
        </div>
      )}
      {facts.length > 0 && (
        <div className="divide-border/50 flex flex-col divide-y">
          {facts.map((fact, index) => (
            <div
              key={index}
              className="container flex items-center justify-between gap-4 py-2 text-[12.5px]"
            >
              <div className="text-muted-foreground">{fact.label}</div>
              <div className="text-foreground truncate font-medium">
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      )}
      {((phones && phones.length > 0) || (socialLinks && socialLinks.length > 0)) && (
        <div className="container flex items-center gap-2 py-2.5">
          {phones && phones.length > 0 && <CallButton phones={phones} t={t} />}
          {socialLinks?.map((link, index) => {
            const platform = detectSocialPlatform(link);
            return (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t(platform.label)}
                className="text-muted-foreground hover:text-foreground"
              >
                <HugeiconsIcon icon={platform.icon} className="size-4.5" />
              </a>
            );
          })}
        </div>
      )}
      {hours.length > 0 && (
        <div className="divide-border/50 flex flex-col divide-y">
          {hours.map((row, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 px-3 py-1.5 text-[12.5px]"
            >
              <span className="text-muted-foreground w-10">{row.day}</span>
              <span
                className={cn(
                  "text-foreground font-medium",
                  row.label === t("Closed") && "text-muted-foreground",
                )}
              >
                {row.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {category === "food-drinks" && !!data.menuUrl && (
        <div className="container flex flex-col gap-1.5 py-2.5">
          <a
            href={String(data.menuUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-[12.5px] font-medium hover:underline"
          >
            {t("View menu")}
          </a>
        </div>
      )}

      {/* Location is always the last section — its text sits right
          above the map it describes, rather than mixed in with the
          other facts higher up the card. */}
      {location && (
        <div className="container flex items-center justify-between gap-4 py-2 text-[12.5px]">
          <div className="text-muted-foreground">{t("Location")}</div>
          <div className="text-foreground truncate font-medium">
            {location.description}{" "}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "icon" }))}
              >
                <HugeiconsIcon
                  icon={MapsLocation01Icon}
                  className="inline size-3.5 align-text-bottom"
                />
                <span className="sr-only">{t("Open in Google Maps")}</span>
              </a>
            )}
          </div>
        </div>
      )}
      {mapsEmbedUrl && (
        <div className="aspect-video max-h-60 w-full">
          <iframe
            src={mapsEmbedUrl}
            title={t("Location")}
            loading="lazy"
            className="size-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
    </div>
  );
}
