import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";

import { AppHeader } from "@/components/app-header";
import { BUSINESS_CATEGORIES } from "@/db/schema";
import { CATEGORY_META } from "@/lib/categories";
import { getLocale } from "@/lib/i18n/actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getLocale();
  return { title: `${t("Categories")} — Qura` };
}

export default async function CategoriesPage() {
  const { t } = await getLocale();

  return (
    <div className="flex flex-col gap-2 py-4">
      <AppHeader title={t("Categories")} backHref="/search" />

      <div className="container grid grid-cols-3 gap-2.5 px-4">
        {BUSINESS_CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/categories/${category}`}
            className="bg-muted flex flex-col items-center gap-1.5 rounded-2xl px-1.5 py-3.5"
          >
            <span className="bg-background flex size-9.5 items-center justify-center rounded-full shadow-xs">
              <HugeiconsIcon
                icon={CATEGORY_META[category].icon}
                className="text-primary size-4.5"
                strokeWidth={1.7}
              />
            </span>
            <span className="text-center text-[11px] leading-tight font-semibold">
              {t(CATEGORY_META[category].label)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
