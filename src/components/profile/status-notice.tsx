import { HugeiconsIcon, StoreRemove01Icon } from "@/components/icons";
import type { BusinessStatus } from "@/lib/business-status";
import { getTranslations } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

const NOTICES: Record<Exclude<BusinessStatus, "active">, MessageKey> = {
  closed: "This business has closed.",
  pending: "Waiting for approval — only you can see this page.",
  suspended: "Suspended by an admin — only you can see this page.",
};

/**
 * A banner on a business page that isn't live: closed (everyone sees it),
 * or pending / suspended (shown only to its owner, creator and admins).
 */
export async function StatusNotice({
  status,
}: {
  status: Exclude<BusinessStatus, "active">;
}) {
  const { t } = await getTranslations();
  return (
    <p
      role="status"
      className={cn(
        "mt-2 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium",
        status === "suspended"
          ? "bg-destructive/10 text-destructive"
          : status === "pending"
            ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
            : "bg-muted text-foreground",
      )}
    >
      <HugeiconsIcon icon={StoreRemove01Icon} strokeWidth={2} className="size-5 shrink-0" />
      {t(NOTICES[status])}
    </p>
  );
}
