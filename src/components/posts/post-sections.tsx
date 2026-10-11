import type { ReactNode } from "react";

import {
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  HugeiconsIcon,
} from "@/components/icons";
import { StackLink } from "@/components/navigation/stack-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { categoryOf } from "@/lib/categories";
import { getTranslations } from "@/lib/i18n/server";
import { inLocale } from "@/lib/localized";
import { dayOf, type Post } from "@/lib/posts";
import { href } from "@/lib/routes";

import { PostCard } from "./post-card";
import { POST_TYPE_META } from "./type-meta";

/** "Offers today": colorful offer cards in a sideways row, then See all. */
export async function OffersStrip({ offers }: { offers: Post[] }) {
  const { t } = await getTranslations();
  if (!offers.length) return null;
  return (
    <HomeSection
      id="home-offers"
      title={t("Offers today")}
      more={href("posts", { query: { type: "offer" } })}
    >
      <div className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none]">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </HomeSection>
  );
}

/**
 * An offer as a coupon: a colored stub with the deal (price / discount) big,
 * a dashed tear line with notches, then the business, the text and until
 * when.
 */
async function OfferCard({ offer }: { offer: Post }) {
  const { t, locale } = await getTranslations();
  const { author } = offer;
  const name =
    author.type === "business" ? inLocale(author.name, locale) : author.name;
  const category =
    author.type === "business" ? categoryOf(author.category) : undefined;

  return (
    <StackLink
      href={href("post", { params: { id: offer.id } })}
      className="relative flex h-36 w-80 max-w-[calc(100vw-3rem)] shrink-0 snap-start overflow-hidden rounded-2xl bg-card text-start ring-1 ring-foreground/5"
    >
      {/* Stub: the deal. */}
      <span className="flex w-28 shrink-0 flex-col items-center justify-center gap-1 bg-linear-to-b from-emerald-500 to-teal-600 px-2 text-center text-white">
        <HugeiconsIcon
          icon={POST_TYPE_META.offer.icon}
          strokeWidth={2}
          className="size-5 opacity-80"
        />
        <bdi
          dir="auto"
          className="line-clamp-2 text-xl leading-tight font-extrabold break-words"
        >
          {offer.data.price || t(POST_TYPE_META.offer.label)}
        </bdi>
      </span>
      {/* Tear line: dashed, with a notch at each end. */}
      <span
        aria-hidden
        className="relative w-0 border-s-2 border-dashed border-border"
      >
        <span className="absolute -top-2.5 -start-2.5 size-5 rounded-full bg-background" />
        <span className="absolute -bottom-2.5 -start-2.5 size-5 rounded-full bg-background" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <span className="flex min-w-0 items-center gap-1.5">
          <Avatar className="size-6 shrink-0">
            {author.image && <AvatarImage src={author.image} alt="" />}
            <AvatarFallback className="bg-primary/10 text-primary">
              {category ? (
                <HugeiconsIcon
                  icon={category.icon}
                  strokeWidth={1.75}
                  className="size-3.5"
                />
              ) : (
                name.slice(0, 1)
              )}
            </AvatarFallback>
          </Avatar>
          <bdi dir="auto" className="truncate text-xs font-semibold">
            {name}
          </bdi>
          {author.type === "business" && author.verified && (
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              strokeWidth={2}
              role="img"
              aria-label={t("Verified")}
              className="size-3.5 shrink-0 text-primary"
            />
          )}
        </span>
        <span
          dir="auto"
          className="line-clamp-3 flex-1 text-sm leading-snug font-medium"
        >
          {offer.body}
        </span>
        {offer.data.endsOn && !offer.ended ? (
          <span className="flex items-center gap-1 text-[0.6875rem] font-medium text-emerald-700 dark:text-emerald-400">
            <HugeiconsIcon
              icon={Clock01Icon}
              strokeWidth={2}
              className="size-3"
            />
            {t("Until {{date}}", {
              date: dayOf(offer.data.endsOn).toLocaleDateString(locale, {
                day: "numeric",
                month: "short",
              }),
            })}
          </span>
        ) : (
          <span className="text-[0.6875rem] text-muted-foreground">
            {t("See the offer")}
          </span>
        )}
      </span>
    </StackLink>
  );
}

/** Posts as a sideways row of cards, snapping card by card. */
export function PostRow({ posts, label }: { posts: Post[]; label: string }) {
  if (!posts.length) return null;
  return (
    <ul
      aria-label={label}
      className="flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none]"
    >
      {posts.map((post) => (
        <li key={post.id} className="flex">
          <PostCard post={post} signedIn={false} compact />
        </li>
      ))}
    </ul>
  );
}

/** A titled home section, with an optional "See all" link. */
export async function HomeSection({
  id,
  title,
  more,
  children,
}: {
  id: string;
  title: string;
  more?: string;
  children: ReactNode;
}) {
  const { t } = await getTranslations();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex items-center ps-4 pe-1">
        <h2 id={id} className="flex-1 truncate text-lg font-bold">
          {title}
        </h2>
        {more && (
          <StackLink
            href={more}
            aria-label={t("See all: {{title}}", { title })}
            className="flex h-11 items-center gap-0.5 px-3 text-sm font-medium text-muted-foreground"
          >
            {t("See all")}
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="size-4 rtl:rotate-180"
            />
          </StackLink>
        )}
      </div>
      {children}
    </section>
  );
}
