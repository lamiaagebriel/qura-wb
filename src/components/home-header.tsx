import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

import { CitySwitcher } from "@/components/city-switcher";
import type { CityId } from "@/db/schema/cities";
import { getLocale } from "@/lib/i18n/actions";
import { cn } from "@/lib/utils";

const GREETING_HOURS = {
  morning: [5, 12],
  afternoon: [12, 17],
  evening: [17, 22],
} as const;

function greetingKey(
  hour: number,
): "Good morning" | "Good afternoon" | "Good evening" | "Good night" {
  if (hour >= GREETING_HOURS.morning[0] && hour < GREETING_HOURS.morning[1]) {
    return "Good morning";
  }
  if (
    hour >= GREETING_HOURS.afternoon[0] &&
    hour < GREETING_HOURS.afternoon[1]
  ) {
    return "Good afternoon";
  }
  if (hour >= GREETING_HOURS.evening[0] && hour < GREETING_HOURS.evening[1]) {
    return "Good evening";
  }
  return "Good night";
}

/**
 * The home feed's own header, replacing the generic `AppHeader` title bar
 * — location context, a time-of-day greeting, and a search entry point,
 * the way a "this is the product" home screen leads rather than a bare
 * "Feed" title. The greeting reads Aswan's local hour (`Africa/Cairo`)
 * off the server clock rather than the visitor's device clock, so it's
 * consistent for everyone looking at the same city's feed regardless of
 * where they personally are.
 */
export async function HomeHeader({
  name,
  activeCity,
}: {
  name?: string;
  activeCity: CityId;
}) {
  const { t } = await getLocale();
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Cairo",
    }).format(new Date()),
  );

  return (
    <div className="border-border/50 bg-background/85 sticky top-0 z-40 flex flex-col gap-3 border-b pt-3 pb-3 backdrop-blur-xl sm:px-6">
      <div className="container">
        <CitySwitcher activeCity={activeCity} />

        <h1 className="text-lg font-semibold">
          {t(greetingKey(hour))}
          {name ? `, ${name?.split(" ")?.[0]}` : ""}
        </h1>

        <Link
          href="/search"
          className={cn(
            "border-input bg-input/20 file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 mb-2 flex h-7 w-full min-w-0 items-center gap-2 rounded-md border px-2 py-0.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs/relaxed file:font-medium focus-visible:ring-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 md:text-xs/relaxed",
          )}
          // className="border-border bg-muted/50 text-muted-foreground flex h-10 items-center gap-2 rounded-full border px-4 text-[14px]"
        >
          <HugeiconsIcon icon={Search01Icon} className="size-4 shrink-0" />
          <span className="text-muted-foreground truncate">
            {t("Search what's around you…")}
          </span>
        </Link>
      </div>
    </div>
  );
}
