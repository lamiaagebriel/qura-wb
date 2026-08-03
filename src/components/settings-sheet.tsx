"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  GlobeIcon,
  InformationCircleIcon,
  Logout01Icon,
  MoonIcon,
  Notification01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ModeSwitcher } from "@/components/mode-switcher";
import { signOutAction } from "@/lib/auth/actions/sign-out";
import { LocaleSwitcher } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

function Row({
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

/** Settings live behind the gear icon, not inline on the profile — same
 * pattern as any social app (Instagram/Threads put account settings in a
 * sheet/menu off the profile, not as a permanent block taking up feed
 * space). */
export function SettingsSheet({
  labels,
  user,
}: {
  labels: {
    settings: string;
    language: string;
    theme: string;
    notifications: string;
    about: string;
    signOut: string;
  };
  user?: {
    id: string;
    name: string;
    email?: string | null;
    image?: string | null;
    role?: string;
    // add any other relevant user fields here
  } | null;
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
        <div className="flex flex-col px-4 pb-2">
          <Row
            icon={GlobeIcon}
            label={labels.language}
            trailing={<LocaleSwitcher />}
          />
          <Row
            icon={MoonIcon}
            label={labels.theme}
            trailing={<ModeSwitcher />}
          />
          <Row icon={Notification01Icon} label={labels.notifications} />
          <Row icon={InformationCircleIcon} label={labels.about} last />
        </div>
        {user && (
          <div className="px-4 pb-6">
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="outline"
                className="text-destructive w-full"
              >
                <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                {labels.signOut}
              </Button>
            </form>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
