"use client";

import { ConfirmButton } from "@/components/confirm-button";
import { HugeiconsIcon, PencilEdit02Icon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

// 32px pill halves, icons only; the ::before keeps each tap area at 44px.
const HALF =
  "relative h-8 min-w-9 gap-1.5 px-2.5 text-xs font-semibold text-muted-foreground before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-['']";

/**
 * ✏️ | 🗑 at the end of your item's name line (a reply, your review): one
 * soft pill, icons only. The trash takes two taps (`ConfirmButton`): it
 * opens into a red "Delete?" first.
 */
export function EditDeleteGroup({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => unknown;
}) {
  const { t } = useLocale();
  return (
    <ButtonGroup className="rounded-full bg-muted/70 dark:bg-muted/50">
      <button
        type="button"
        aria-label={t("Edit")}
        onClick={onEdit}
        className={cn(
          buttonVariants({ variant: "ghost" }),
          HALF,
          "rounded-s-full! rounded-e-none",
        )}
      >
        <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" />
      </button>
      <ButtonGroupSeparator className="h-4! self-center bg-foreground/15" />
      <ConfirmButton
        icon
        label={t("Delete")}
        confirmLabel={t("Delete?")}
        className={cn(HALF, "rounded-s-none rounded-e-full!")}
        onConfirm={onDelete}
      />
    </ButtonGroup>
  );
}
