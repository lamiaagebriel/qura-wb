"use client";

import { useState } from "react";

import { BusinessStatusBadge } from "@/components/business-status-badge";
import { ArrowDown01Icon, HugeiconsIcon } from "@/components/icons";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  pending:
    "Waiting for an admin to approve it. Only you can see it until then.",
  active: "everyone can find it.",
  suspended:
    "Suspended by an admin: hidden from everyone but you. Contact us to fix it.",
  closed: "its page stays up and says it's closed, but it isn't listed.",
  deleted: "it's deleted: hidden from everyone but you.",
};

/**
 * A business's status, as a field of the business form: it's saved (or,
 * for its creator, sent to an admin) with "Save changes". Admins get a
 * select (a sheet of every status); the owner and its creator only ever go
 * open ⇄ closed, so they get an "Open" switch. Nothing they may pick
 * (pending, suspended, a request already open) → disabled.
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
  const [open, setOpen] = useState(false);

  const request = openRequest ? null : allowedRequest(role, saved);
  // Picked directly, or (creator) asked for.
  const options: BusinessStatus[] = request
    ? [requestTarget(request)]
    : allowedStatuses(role, saved);
  const editable = options.length > 0;
  const changed = value !== saved;

  const hint = openRequest
    ? t("Request sent. An admin will review it.")
    : changed
      ? request
        ? t("Saving will ask an admin to make it “{{status}}”.", {
            status: t(STATUS_LABELS[value]),
          })
        : t("Saved when you save your changes.")
      : t(EXPLAIN[value]);

  return (
    <section aria-label={t("Status")} className="flex flex-col gap-2">
      {role !== "admin" ? (
        // Owner / creator: open ⇄ closed is all there is — a switch.
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
      ) : (
        <button
          type="button"
          disabled={!editable}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={t("Status: {{status}}", {
            status: t(STATUS_LABELS[value]),
          })}
          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-card px-4 py-2 text-start ring-1 ring-foreground/5 disabled:opacity-100"
        >
          <span className="text-sm font-medium">{t("Status")}</span>
          <span className="flex items-center gap-2">
            <BusinessStatusBadge status={value} />
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </span>
        </button>
      )}
      <p className="px-1 text-sm text-muted-foreground">{hint}</p>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-[max(var(--safe-bottom),1rem)]">
          <DrawerHeader>
            <DrawerTitle>{t("Change status")}</DrawerTitle>
          </DrawerHeader>
          <RadioGroup
            value={value}
            onValueChange={(next) => {
              onChange(next as BusinessStatus);
              setOpen(false);
            }}
            aria-label={t("Status")}
            className="mx-4 w-auto gap-0 divide-y divide-border/60 overflow-hidden"
          >
            {[saved, ...options].map((s) => (
              // The whole row is the label, so tapping anywhere selects it.
              <Label
                key={s}
                className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-4 py-2"
              >
                <BusinessStatusBadge status={s} />
                <RadioGroupItem value={s} />
              </Label>
            ))}
          </RadioGroup>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
