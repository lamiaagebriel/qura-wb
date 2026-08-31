import { HugeiconsIcon } from "@hugeicons/react";
import { Rocket01Icon } from "@hugeicons/core-free-icons";

/**
 * Shown in place of the feed, categories, and search wherever the active
 * city (`getActiveCity`) isn't in `AVAILABLE_CITIES` yet — rather than
 * querying and rendering a misleading "nothing here" empty state, every
 * city-scoped list checks `isCityAvailable` first and renders this
 * instead. Text comes in pre-translated (a server component already has
 * `t` on hand) rather than this component calling `useLocale` itself.
 */
export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-20 text-center">
      <HugeiconsIcon
        icon={Rocket01Icon}
        strokeWidth={1.5}
        className="text-muted-foreground size-8"
      />
      <p className="text-foreground text-[15px] font-semibold">{title}</p>
      <p className="text-muted-foreground text-[13px]">{description}</p>
    </div>
  );
}
