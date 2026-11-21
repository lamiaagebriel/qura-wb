import { HugeiconsIcon } from "@/components/icons";
import Link from "next/link";
import type { Category } from "@/lib/categories";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/**
 * Business categories as a sideways row of round icons with their name
 * under them (like story circles); each searches for it.
 */
export async function CategoryCircles({
  label,
  categories,
}: {
  label: string;
  categories: Category[];
}) {
  const { locale } = await getTranslations();
  if (!categories.length) return null;
  return (
    <nav
      aria-label={label}
      className="flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none]"
    >
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={href("search", { query: { q: category.name[locale] } })}
          className="flex w-17 shrink-0 snap-start flex-col items-center gap-1.5 text-center"
        >
          <span className="flex size-15 items-center justify-center rounded-full bg-card text-primary ring-1 ring-foreground/10">
            <HugeiconsIcon icon={category.icon} className="size-7" />
          </span>
          <span className="line-clamp-2 text-xs leading-tight font-medium">
            {category.name[locale]}
          </span>
        </Link>
      ))}
    </nav>
  );
}
