"use client";

import {
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  HugeiconsIcon,
  Store01Icon,
} from "@/components/icons";
import { BusinessStatusBadge } from "@/components/business-status-badge";
import { StackLink } from "@/components/navigation/stack-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { categoryOf } from "@/lib/categories";
import { usePlaces } from "@/components/places/places-provider";
import { useLocale } from "@/lib/i18n/provider";
import { inLocale } from "@/lib/localized";
import { placeName } from "@/lib/places";
import { href } from "@/lib/routes";

import type { BusinessSummary } from "@/lib/business";

/**
 * A card of businesses; each row opens its public profile, or with
 * `editable` (your own businesses) its edit screen. Slides in.
 */
export function BusinessList({
  businesses,
  editable = false,
}: {
  businesses: BusinessSummary[];
  editable?: boolean;
}) {
  const { t, locale } = useLocale();
  const places = usePlaces();

  return (
    <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
      {businesses.map((business) => {
        const category = categoryOf(business.category);
        const cities = business.cities
          .map((slug) => places.get(slug))
          .filter((place) => place !== undefined)
          .map((place) => placeName(place, locale))
          .join(locale === "ar" ? "، " : ", ");
        return (
          <li key={business.username}>
            <StackLink
              href={href(editable ? "editBusiness" : "business", {
                params: { username: business.username },
              })}
              className="flex min-h-16 items-center gap-3 px-4 py-2.5 text-start"
            >
              <Avatar className="size-11 shrink-0">
                {business.avatarUrl && (
                  <AvatarImage src={business.avatarUrl} alt="" />
                )}
                <AvatarFallback className="bg-primary/10 text-primary">
                  <HugeiconsIcon
                    icon={category?.icon ?? Store01Icon}
                    strokeWidth={1.75}
                    className="size-5"
                  />
                </AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex min-w-0 items-center gap-1 font-semibold">
                  <span dir="auto" className="truncate">
                    {inLocale(business.name, locale)}
                  </span>
                  {business.verified && (
                    <HugeiconsIcon
                      icon={CheckmarkBadge01Icon}
                      strokeWidth={2}
                      role="img"
                      aria-label={t("Verified")}
                      className="size-4 shrink-0 text-primary"
                    />
                  )}
                  {business.status !== "active" && (
                    <BusinessStatusBadge
                      status={business.status}
                      className="ms-auto"
                    />
                  )}
                </span>
                <span className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                  <span className="truncate">
                    {category?.name[locale]}
                    {category && cities && " · "}
                    {cities}
                  </span>
                  {/* {category && `${category.name[locale]} · `}
                  <bdi dir="ltr">@{business.username}</bdi> */}
                </span>
              </span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
              />
            </StackLink>
          </li>
        );
      })}
    </ul>
  );
}
