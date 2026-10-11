"use client";

import type { ReactNode } from "react";

import {
  CheckmarkBadge01Icon,
  HugeiconsIcon,
  Tick02Icon,
  UserCircleIcon,
} from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { categoryOf } from "@/lib/categories";
import { useLocale } from "@/lib/i18n/provider";
import type { PostingBusiness, PostingUser } from "@/lib/posts";

const ME = "@me";

/**
 * "Post as": who the post comes from, as a row of big badges — you,
 * then each of your live businesses — that scrolls sideways. The chosen one
 * is outlined with a tick on its avatar. `allowMe` off (offers,
 * announcements): businesses only. `value` is a business @handle, "" = you.
 */
export function PostAsPicker({
  me,
  businesses,
  allowMe,
  value,
  onChange,
  label,
}: {
  me: PostingUser | null;
  businesses: PostingBusiness[];
  allowMe: boolean;
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const { t, locale } = useLocale();

  return (
    <ToggleGroup
      aria-label={label}
      // The group ignores an empty value, so "you" is ME inside it.
      value={[value || ME]}
      onValueChange={(next) => {
        if (!next.length) return;
        const picked = next[0] as string;
        onChange(picked === ME ? "" : picked);
      }}
      // Full-bleed row (past the screen's padding), edges faded.
      className="-mx-4 w-auto snap-x scroll-px-4 gap-2 overflow-x-auto px-4 py-1 [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)] [scrollbar-width:none]"
    >
      {allowMe && me && (
        <Card
          value={ME}
          name={me.name}
          handle={me.username}
          caption={t("Personal")}
          image={me.image}
          fallback={
            <HugeiconsIcon
              icon={UserCircleIcon}
              strokeWidth={1.75}
              className="size-6"
            />
          }
        />
      )}
      {businesses.map((b) => {
        const category = categoryOf(b.category);
        return (
          <Card
            key={b.username}
            value={b.username}
            name={b.name}
            handle={b.username}
            caption={category ? category.name[locale] : t("Business")}
            image={b.image}
            verified={b.verified}
            fallback={
              category && (
                <HugeiconsIcon
                  icon={category.icon}
                  strokeWidth={1.75}
                  className="size-6"
                />
              )
            }
          />
        );
      })}
    </ToggleGroup>
  );
}

/** One identity: avatar (tick when chosen), name, type and @handle. */
function Card({
  value,
  name,
  handle,
  caption,
  image,
  verified = false,
  fallback,
}: {
  value: string;
  name: string;
  handle: string;
  caption: string;
  image: string | null;
  verified?: boolean;
  fallback: ReactNode;
}) {
  const { t } = useLocale();
  return (
    <ToggleGroupItem
      value={value}
      aria-label={`${name} (@${handle})`}
      // A big badge: avatar, then name over "kind · @handle"; 56px tall.
      className="group/card h-14 max-w-64 shrink-0 snap-start gap-2.5 rounded-full border border-border bg-card ps-1.5 pe-4 text-start transition-[box-shadow,background-color,border-color] hover:bg-card aria-pressed:bg-primary/5 data-[pressed]:border-primary data-[pressed]:bg-primary/5 data-[pressed]:ring-1 data-[pressed]:ring-primary"
    >
      <span className="relative shrink-0">
        <Avatar size="lg" className="size-11">
          {image && <AvatarImage src={image} alt="" />}
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {fallback ?? name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -end-0.5 -bottom-0.5 hidden size-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-card group-data-[pressed]/card:flex">
          <HugeiconsIcon icon={Tick02Icon} strokeWidth={3} className="size-3" />
        </span>
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1 text-sm leading-tight font-semibold">
          <bdi dir="auto" className="truncate">
            {name}
          </bdi>
          {verified && (
            <HugeiconsIcon
              icon={CheckmarkBadge01Icon}
              strokeWidth={2}
              role="img"
              aria-label={t("Verified")}
              className="size-3.5 shrink-0 text-primary"
            />
          )}
        </span>
        <span className="flex min-w-0 items-center gap-1 text-xs leading-tight font-normal text-muted-foreground">
          <span className="shrink-0">{caption}</span>
          <span aria-hidden>·</span>
          <bdi dir="ltr" className="truncate">
            @{handle}
          </bdi>
        </span>
      </span>
    </ToggleGroupItem>
  );
}
