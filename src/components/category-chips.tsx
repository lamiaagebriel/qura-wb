import { HugeiconsIcon, type IconSvgElement } from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "@/lib/i18n/server";
import { href } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type CategoryChip = {
  slug: string;
  name: string;
  icon: IconSvgElement;
  /** Businesses in it, subcategories included. */
  count: number;
};

/**
 * A row of category chips that scrolls sideways: each chip is the
 * category's icon (its business count in the avatar's badge) and name, and
 * opens the category. `current` marks the chip of the page you're on (not a
 * link) — e.g. the "All" chip on a category page.
 */
export async function CategoryChips({
  label,
  chips,
  current,
}: {
  label: string;
  chips: CategoryChip[];
  current?: string;
}) {
  const { t } = await getTranslations();
  if (!chips.length) return null;

  return (
    <nav
      aria-label={label}
      // Fades the row's edges so it reads as scrollable.
      className="flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 py-1.5 [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)] [scrollbar-width:none]"
    >
      {chips.map((chip) => {
        const selected = chip.slug === current;
        const content = (
          <>
            <Avatar size="sm" className="after:hidden">
              <AvatarFallback
                className={cn(
                  "bg-primary/10 text-primary",
                  selected &&
                    "bg-primary-foreground/15 text-primary-foreground",
                )}
              >
                <HugeiconsIcon
                  icon={chip.icon}
                  strokeWidth={1.75}
                  className="size-3.5"
                />
              </AvatarFallback>
            </Avatar>
            <span>{chip.name}</span>
            {/*  bg-muted text-muted-foreground  */}
            <Badge className="ring-0 -inset-e-1.5 -bottom-1 h-3! min-w-3! px-0.5! text-[0.5625rem] leading-none font-semibold tabular-nums">
              {chip.count}
            </Badge>
            <span className="sr-only">
              {t("{{count}} businesses", { count: chip.count })}
            </span>
          </>
        );
        // h-9 looks like a chip; the ::before stretches the tap area to 44px.
        const chipClass =
          "relative h-9 snap-start overflow-visible ps-1 pe-3 text-xs before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']";
        return selected ? (
          <Badge key={chip.slug} aria-current="page" className={chipClass}>
            {content}
          </Badge>
        ) : (
          <Badge
            key={chip.slug}
            variant="outline"
            className={cn(chipClass, "bg-card")}
            render={
              <StackLink
                href={href("category", { params: { slug: chip.slug } })}
              />
            }
          >
            {content}
          </Badge>
        );
      })}
    </nav>
  );
}
