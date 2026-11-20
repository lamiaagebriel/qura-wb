"use client";

import { BusinessStatusBadge } from "@/components/business-status-badge";
import { Switch } from "@/components/ui/switch";
import {
  allowedRequest,
  allowedStatuses,
  requestTarget,
  STATUS_LABELS,
  type BusinessRole,
  type BusinessStatus,
  type RequestKind,
} from "@/lib/business-status";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";

const EXPLAIN: Record<BusinessStatus, MessageKey> = {
  pending: "Waiting to go live. Only you can see it until then.",
  active: "everyone can find it.",
  suspended: "Suspended: hidden from everyone but you. Contact us to fix it.",
  closed: "its page stays up and says it's closed, but it isn't listed.",
  deleted: "it's deleted: hidden from everyone but you.",
};

/**
 * A business's status, as a field of the business form, saved with "Save
 * changes". The owner and its creator only ever go open ⇄ closed: an
 * "Open" switch. Nothing they may pick (pending, suspended, a request
 * already open) → disabled.
 */
export function StatusPanel({
  saved,
  value,
  onChange,
  role,
  openRequest,
}: {
  /** The status as stored; what this user may pick depends on it. */
  saved: BusinessStatus;
  value: BusinessStatus;
  onChange: (status: BusinessStatus) => void;
  role: BusinessRole;
  openRequest: RequestKind | null;
}) {
  const { t } = useLocale();

  const request = openRequest ? null : allowedRequest(role, saved);
  // Picked directly, or (creator) asked for.
  const options: BusinessStatus[] = request
    ? [requestTarget(request)]
    : allowedStatuses(role, saved);
  const editable = options.length > 0;
  const changed = value !== saved;

  const hint = openRequest
    ? t("Request sent.")
    : changed
      ? request
        ? t("Saving will ask to make it “{{status}}”.", {
            status: t(STATUS_LABELS[value]),
          })
        : t("Saved when you save your changes.")
      : t(EXPLAIN[value]);

  return (
    <section aria-label={t("Status")} className="flex flex-col gap-2">
      <label className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-card px-4 py-2 ring-1 ring-foreground/5">
        <span className="flex items-center gap-2 text-sm font-medium">
          {t("Open")}
          <BusinessStatusBadge status={value} />
        </span>
        <Switch
          checked={value === "active"}
          disabled={!editable}
          onCheckedChange={(on) => onChange(on ? "active" : "closed")}
        />
      </label>
      <p className="px-1 text-sm text-muted-foreground">{hint}</p>
    </section>
  );
}
