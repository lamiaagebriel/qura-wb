import Link from "next/link";

import {
  DashboardSquare02Icon,
  HugeiconsIcon,
  type IconSvgElement,
} from "@/components/icons";
import type { Category } from "@/lib/categories";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

// Up to two rows of four: seven categories, then "More" (all, on Search).
const SHOWN = 7;

/**
 * Business categories as a grid of soft square tiles (icon over name);
 * each searches for it. The last tile is always "More", which
 * opens Search with the full category grid.
 */
export async function CategoryCircles({
  label,
  categories,
}: {
  label: string;
  categories: Category[];
}) {
  const { t, locale } = await getTranslations();
  if (!categories.length) return null;

  const shown = categories.slice(0, SHOWN);
  return (
    <nav aria-label={label} className="grid grid-cols-4 gap-2 px-4">
      {shown.map((category) => (
        <Tile
          key={category.slug}
          href={href("search", { query: { q: category.name[locale] } })}
          icon={category.icon}
          name={category.name[locale]}
        />
      ))}
      {
        <Tile
          href={href("search")}
          icon={DashboardSquare02Icon}
          name={t("More")}
        />
      }
    </nav>
  );
}

function Tile({
  href,
  icon,
  name,
}: {
  href: string;
  icon: IconSvgElement;
  name: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-22 flex-col items-center justify-center gap-1.5 rounded-2xl bg-primary/5 px-1 py-3 text-center ring-1 ring-foreground/5 transition-[scale] active:scale-95 motion-reduce:transition-none"
    >
      <HugeiconsIcon icon={icon} className="size-7 text-primary" />
      <span className="line-clamp-2 text-[11px] leading-tight font-medium">
        {name}
      </span>
    </Link>
  );
}
