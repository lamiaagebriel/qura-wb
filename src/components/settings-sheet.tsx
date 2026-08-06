"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  GlobeIcon,
  InformationCircleIcon,
  MoonIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ModeSwitcher } from "@/components/mode-switcher";
import { SettingsControlRow } from "@/components/settings-control-row";
import { LocaleSwitcher } from "@/lib/i18n/client";

/**
 * Signed-out only now — a signed-in user's gear icon is a `Link` straight
 * to `/account/settings` instead (see `account/page.tsx`), which has room
 * for the full settings list (privacy, invite, log out,
 * ...) that doesn't make sense to offer before there's an account to apply
 * them to. This sheet keeps just the two things that are meaningful
 * pre-auth: language and theme.
 */
export function SettingsSheet({
  labels,
}: {
  labels: {
    settings: string;
    language: string;
    theme: string;
    about: string;
  };
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label={labels.settings}
          className="hover:bg-muted flex size-9 items-center justify-center rounded-full transition-colors"
        >
          <HugeiconsIcon icon={Settings01Icon} className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{labels.settings}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col px-4 pb-6">
          <SettingsControlRow
            icon={GlobeIcon}
            label={labels.language}
            trailing={<LocaleSwitcher />}
          />
          <SettingsControlRow
            icon={MoonIcon}
            label={labels.theme}
            trailing={<ModeSwitcher />}
          />
          <SettingsControlRow icon={InformationCircleIcon} label={labels.about} last />
        </div>
      </SheetContent>
    </Sheet>
  );
}
