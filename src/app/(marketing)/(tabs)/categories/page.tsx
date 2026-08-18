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
      <AppHeader title={t("Categories")} showBack={false} />

      <div className="container grid grid-cols-2 gap-3 px-4">
        {BUSINESS_CATEGORIES.map((category) => (
          <Link
            key={category}
            href={`/categories/${category}`}
            className="border-border/60 bg-muted/20 hover:bg-muted/40 flex flex-col items-start gap-2 rounded-lg border p-4 transition-colors"
          >
            <HugeiconsIcon
              icon={CATEGORY_META[category].icon}
              className="text-primary size-6"
            />
            <span className="text-foreground text-[14px] font-semibold">
              {t(CATEGORY_META[category].label)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
