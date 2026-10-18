"use client";

import Link from "next/link";

import { HugeiconsIcon, Tick02Icon, MinusSignIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Cell, Tone } from "@/lib/admin/types";
import { timeAgo } from "@/lib/format";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** Status colors: soft background, strong text, in light and dark. */
export const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  green: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  red: "bg-red-500/15 text-red-700 dark:text-red-400",
  blue: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
};

export function ToneBadge({ value, tone }: { value: string; tone: Tone }) {
  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", TONES[tone])}>
      {value}
    </Badge>
  );
}

const Sub = ({ children }: { children: string }) => (
  <span dir="auto" className="block truncate text-xs text-muted-foreground">
    {children}
  </span>
);

/**
 * One value in a dashboard table, related list or locked field. Links
 * stop the row's own click (the row opens its record).
 */
export function CellView({ cell }: { cell: Cell }) {
  const { locale } = useLocale();
  switch (cell.kind) {
    case "empty":
      return <span className="text-muted-foreground">—</span>;
    case "text":
      return (
        <span className="block max-w-80 min-w-0">
          <span dir={cell.dir ?? "auto"} className="block truncate">
            {cell.value}
          </span>
          {cell.sub && <Sub>{cell.sub}</Sub>}
        </span>
      );
    case "link":
      return (
        <span className="block max-w-80 min-w-0">
          <Link
            href={cell.href}
            onClick={(event) => event.stopPropagation()}
            dir="auto"
            className="block truncate font-medium text-primary underline-offset-4 hover:underline"
          >
            {cell.value}
          </Link>
          {cell.sub && <Sub>{cell.sub}</Sub>}
        </span>
      );
    case "image":
      return (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar className="size-8">
            {cell.src && <AvatarImage src={cell.src} alt={cell.alt} />}
            <AvatarFallback className="text-xs">{cell.value.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span dir="auto" className="block truncate font-medium">
              {cell.value}
            </span>
            {cell.sub && <Sub>{cell.sub}</Sub>}
          </span>
        </span>
      );
    case "badge":
      return <ToneBadge value={cell.value} tone={cell.tone} />;
    case "badges":
      return cell.values.length ? (
        <span className="flex flex-wrap gap-1">
          {cell.values.map((badge, i) => (
            <ToneBadge key={i} value={badge.value} tone={badge.tone} />
          ))}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    case "date": {
      if (!cell.value) return <span className="text-muted-foreground">—</span>;
      const at = new Date(cell.value);
      return (
        // "3 min ago" and the hover's local time can differ between the
        // server and the browser (time passing, time zones).
        <time
          suppressHydrationWarning
          dateTime={cell.value}
          title={at.toLocaleString(locale)}
          className="whitespace-nowrap text-muted-foreground"
        >
          {timeAgo(at, locale)}
        </time>
      );
    }
    case "number":
      return (
        <span className={cn("tabular-nums", !cell.value && "text-muted-foreground")}>
          {new Intl.NumberFormat(locale).format(cell.value)}
        </span>
      );
    case "bool":
      return cell.value ? (
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-4 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} className="size-4 text-muted-foreground" />
      );
  }
}
