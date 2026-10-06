"use client";

import { Badge } from "@/components/ui/badge";
import type { BusinessStatus } from "@/lib/business-status";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

export const STATUS_LABELS: Record<BusinessStatus, MessageKey> = {
  pending: "Pending review",
  active: "Live",
  suspended: "Suspended",
  closed: "Closed",
};

const COLORS: Record<BusinessStatus, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  suspended: "bg-destructive/10 text-destructive",
  closed: "bg-muted text-muted-foreground",
};

/** A business's status as a small coloured badge. */
export function BusinessStatusBadge({
  status,
  className,
}: {
  status: BusinessStatus;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <Badge className={cn(COLORS[status], className)}>
      {t(STATUS_LABELS[status])}
    </Badge>
  );
}
