import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

export function SettingsRow({
  icon,
  label,
  description,
  href,
  destructive,
  last,
}: {
  icon: typeof ArrowRight01Icon;
  label: string;
  description?: string;
  href: string;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 py-3.5",
        !last && "border-border/60 border-b",
      )}
    >
      <HugeiconsIcon
        icon={icon}
        className={cn(
          "size-5 shrink-0",
          destructive ? "text-destructive" : "text-foreground",
        )}
      />
      <div className="flex flex-1 flex-col">
        <span
          className={cn(
            "text-[14.5px] font-medium",
            destructive ? "text-destructive" : "text-foreground",
          )}
        >
          {label}
        </span>
        {description && (
          <span className="text-muted-foreground text-xs">{description}</span>
        )}
      </div>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        className="text-muted-foreground size-4 shrink-0 rtl:rotate-180"
      />
    </Link>
  );
}
