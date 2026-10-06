import { HugeiconsIcon, type IconSvgElement } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * A category's icon in a round avatar, with how many businesses it has
 * (subcategories included) in a badge at the bottom end corner.
 */
export function CategoryAvatar({
  icon,
  count,
  className,
}: {
  icon: IconSvgElement;
  count?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary",
        className,
      )}
    >
      <HugeiconsIcon icon={icon} strokeWidth={1.75} className="size-5" />
      {count !== undefined && (
        <Badge className="absolute -end-1.5 -bottom-1 h-4 min-w-4 px-1 ring-2 ring-background">
          {count}
        </Badge>
      )}
    </span>
  );
}
