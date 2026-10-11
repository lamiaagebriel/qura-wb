import { HugeiconsIcon } from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import type { Category } from "@/lib/categories";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";

/**
 * Business categories as a sideways row of round icons with their name
 * under them (like story circles); each opens the category.
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
        <StackLink
          key={category.slug}
          href={href("category", { params: { slug: category.slug } })}
          className="flex w-17 shrink-0 snap-start flex-col items-center gap-1.5 text-center"
        >
          <span className="flex size-15 items-center justify-center rounded-full bg-card text-primary ring-1 ring-foreground/10">
            <HugeiconsIcon
              icon={category.icon}
              strokeWidth={1.75}
              className="size-7"
            />
          </span>
          <span className="line-clamp-2 text-xs leading-tight font-medium">
            {category.name[locale]}
          </span>
        </StackLink>
      ))}
    </nav>
  );
}
