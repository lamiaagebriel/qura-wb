import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppHeader } from "@/components/app-header";
import { ComingSoon } from "@/components/coming-soon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BUSINESS_CATEGORIES, type BusinessCategory } from "@/db/schema";
import { getBusinessesByCategory } from "@/lib/business/queries";
import { CATEGORY_META } from "@/lib/categories";
import { getActiveCity } from "@/lib/city/actions";
import { CITY_LABEL, isCityAvailable } from "@/lib/city/cities";
import { getLocale } from "@/lib/i18n/actions";

// The field each category's card previews under the business name —
// only `food-drinks`/`health` have a bespoke field to show; every other
// category previews the generic `details` blurb instead.
const PREVIEW_FIELD: Partial<Record<BusinessCategory, string>> = {
  "food-drinks": "cuisine",
  health: "specialty",
};

function isBusinessCategory(value: string): value is BusinessCategory {
  return (BUSINESS_CATEGORIES as readonly string[]).includes(value);
}

type CategoryPageProps = { params: Promise<{ category: string }> };

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const { t } = await getLocale();
  return {
    title: isBusinessCategory(category)
      ? `${t(CATEGORY_META[category].label)} — Qura`
      : "Qura",
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  if (!isBusinessCategory(category)) notFound();

  const [{ t }, city] = await Promise.all([getLocale(), getActiveCity()]);
  const available = isCityAvailable(city);
  const blocks = available ? await getBusinessesByCategory(category, city) : [];

  return (
    <div className="flex flex-col gap-2 py-4">
      <AppHeader
        title={t(CATEGORY_META[category].label)}
        backHref="/categories"
      />

      {!available && (
        <ComingSoon title={t(CITY_LABEL[city])} description={t("Coming soon")} />
      )}

      {available && blocks.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-[13px]">
          {t("No businesses in this category yet.")}
        </p>
      )}

      <ul className="divide-border/60 flex flex-col divide-y">
        {blocks.map(({ business, data }) => {
          const field = PREVIEW_FIELD[category];
          const preview = field
            ? (data as Record<string, unknown>)[field]
            : (data as Record<string, unknown>).details;
          return (
            <li key={business.id}>
              <Link
                href={`/profile/${business.username}`}
                className="container flex items-center gap-3 py-3"
              >
                <Avatar>
                  {business.image && (
                    <AvatarImage src={business.image} alt={business.name} />
                  )}
                  <AvatarFallback>{business.name}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-tight">
                  <span className="text-foreground text-[13.5px] font-medium">
                    {business.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {typeof preview === "string" && preview
                      ? preview
                      : `@${business.username}`}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
