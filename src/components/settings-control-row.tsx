import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, type GlobeIcon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

/**
 * A settings row that holds an inline control (a select, a switch, ...)
 * rather than navigating anywhere — as opposed to `SettingsRow`
 * (`account/settings/settings-row.tsx`), which is a `Link` to a sub-page.
 * Shared by the signed-out `SettingsSheet` and the signed-in
 * `/account/settings` page so language/theme/about render identically in
 * both places.
 */
export function SettingsControlRow({
  icon,
  label,
  trailing,
  last,
}: {
  icon: typeof GlobeIcon;
  label: string;
  trailing?: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-3.5",
        !last && "border-border/60 border-b",
      )}
    >
      <HugeiconsIcon icon={icon} className="text-foreground size-5 shrink-0" />
      <span className="text-foreground flex-1 text-[14.5px] font-medium">
        {label}
      </span>
      {trailing ?? (
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          className="text-muted-foreground size-4 rtl:rotate-180"
        />
      )}
    </div>
  );
}
