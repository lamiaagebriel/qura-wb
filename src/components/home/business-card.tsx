import {
  CheckmarkBadge01Icon,
  HugeiconsIcon,
  StarIcon,
  Store01Icon,
} from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { categoryOf } from "@/lib/categories";
import type { RatedBusiness } from "@/lib/data/businesses";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale } from "@/lib/localized";
import { href } from "@/lib/routes";

/** A business in a home scroller: avatar, name, category and rating. */
export async function BusinessCard({ business }: { business: RatedBusiness }) {
  const { t, locale } = await getTranslations();
  const category = categoryOf(business.category);
  const rating =
    business.rating !== null &&
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(business.rating);

  return (
    <StackLink
      href={href("business", { params: { username: business.username } })}
      className="flex shrink-0 snap-start gap-2 rounded-2xl bg-card py-3 w-60 px-3 text-start ring-1 ring-foreground/5"
    >
      <Avatar className="size-14">
        {business.avatarUrl && <AvatarImage src={business.avatarUrl} alt="" />}
        <AvatarFallback className="bg-primary/10 text-primary">
          <HugeiconsIcon
            icon={category?.icon ?? Store01Icon}
            strokeWidth={1.75}
            className="size-6"
          />
        </AvatarFallback>
      </Avatar>
      <div>
        <span className="flex min-w-0 items-center gap-1 text-sm font-semibold">
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
        </span>
        <span className="truncate text-xs text-muted-foreground">
          {category?.name[locale]}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {rating ? (
            <>
              <HugeiconsIcon
                icon={StarIcon}
                strokeWidth={1.5}
                className="size-3.5 fill-current text-amber-500"
              />
              <span className="font-semibold text-foreground">{rating}</span>
              <span>({business.reviewCount})</span>
            </>
          ) : (
            t("New")
          )}
        </span>
      </div>
    </StackLink>
  );
}
