"use client";

import { FilterPill } from "@/components/filter-pill";
import { HeaderFilter } from "@/components/header-filter";
import { FilterHorizontalIcon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/provider";
import type { PostType } from "@/lib/posts";

import { POST_TYPE_META } from "./type-meta";

/**
 * Filters a list of posts by type (`?type=`): "All types" and `types`,
 * with their counts, in a `FilterPill`.
 */
export function PostTypeFilter({
  types,
  value,
  icon,
}: {
  types: { type: PostType; count: number }[];
  value: PostType | null;
  /** In a header: the filter icon (`HeaderFilter`) instead of the pill. */
  icon?: boolean;
}) {
  const { t, locale } = useLocale();
  const number = new Intl.NumberFormat(locale);
  // A type in the URL with no posts still shows on the pill.
  const listed =
    value && !types.some((option) => option.type === value)
      ? [...types, { type: value, count: 0 }]
      : types;
  const options = [
    {
      value: null,
      label: t("All types"),
      icon: FilterHorizontalIcon,
      iconColors: "bg-muted text-foreground",
    },
    ...listed.map(({ type, count }) => ({
      value: type,
      label: `${t(POST_TYPE_META[type].plural)} · ${number.format(count)}`,
      short: t(POST_TYPE_META[type].plural),
      icon: POST_TYPE_META[type].icon,
      iconColors: POST_TYPE_META[type].tint,
    })),
  ];
  const title = t("Filter by type");
  return icon ? (
    <HeaderFilter
      title={title}
      groups={[{ param: "type", title, value, options }]}
    />
  ) : (
    <FilterPill param="type" value={value} title={title} options={options} />
  );
}
