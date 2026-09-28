"use client";

import type { ReactNode } from "react";

import { HugeiconsIcon, type IconSvgElement } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export type SheetAction = {
  label: string;
  icon?: IconSvgElement;
  /** Red, for destructive choices (delete, report…). */
  destructive?: boolean;
  onSelect: () => void;
};

/**
 * iOS-style action sheet: a list of choices + a separate Cancel. Use it for
 * options (share, report, edit…) instead of menus or popovers.
 *   <ActionSheet open={open} onOpenChange={setOpen} actions={[…]} />
 */
export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  actions: SheetAction[];
}) {
  return (
    <SheetFrame
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => {
              onOpenChange(false);
              action.onSelect();
            }}
            className={cn(
              "flex min-h-14 w-full items-center gap-3 px-4 py-2 text-start text-base font-medium",
              action.destructive && "text-destructive",
            )}
          >
            {action.icon && (
              <HugeiconsIcon icon={action.icon} strokeWidth={2} className="size-5" />
            )}
            {action.label}
          </button>
        ))}
      </div>
    </SheetFrame>
  );
}

/**
 * Shared frame for action/confirm sheets: optional title + description, the
 * content, then a separate Cancel button (iOS layout).
 */
export function SheetFrame({
  open,
  onOpenChange,
  title,
  description,
  children,
  cancelDisabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  cancelDisabled?: boolean;
}) {
  const { t } = useLocale();
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-[max(var(--safe-bottom),1rem)]">
        {title || description ? (
          <DrawerHeader>
            {title && <DrawerTitle className="text-base">{title}</DrawerTitle>}
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
        ) : (
          // Sheets need an accessible name even without a visible title.
          <DrawerTitle className="sr-only">{t("Cancel")}</DrawerTitle>
        )}
        <div className="flex flex-col gap-3 px-4 pt-2">
          {children}
          <Button
            size="xl"
            variant="secondary"
            className="w-full rounded-2xl text-base"
            disabled={cancelDisabled}
            onClick={() => onOpenChange(false)}
          >
            {t("Cancel")}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
