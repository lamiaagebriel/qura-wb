"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { setActiveProfile } from "@/lib/identity/actions";
import { useLocale } from "@/lib/i18n/client";

type Identity = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  isBusiness: boolean;
};

/**
 * Tapping the `@username` header on `/account` opens this — pick your
 * own account or any business you own, and the whole app switches to
 * looking/posting as that identity from here on (see `getActiveIdentity`
 * for what "switches" actually means: it's a per-session default, not a
 * real account change — following/liking/replying always still happen
 * as your real account, since a business can't do those). Also where
 * you add a new one: `/account/business` doubles as create-or-edit
 * depending on the active identity, so "Add a business profile" clears
 * the active identity first — otherwise it'd open straight into editing
 * whatever business happened to already be active instead of a blank
 * create form.
 */
export function ProfileSwitcher({
  identities,
  activeId,
}: {
  identities: Identity[];
  activeId: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const active = identities.find((i) => i.id === activeId) ?? identities[0];

  function select(id: string) {
    setOpen(false);
    if (id === activeId) return;
    startTransition(async () => {
      await setActiveProfile(id === identities[0]?.id ? null : id);
      router.refresh();
    });
  }

  function addBusiness() {
    setOpen(false);
    startTransition(async () => {
      await setActiveProfile(null);
      router.push("/account/business");
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-foreground flex items-center gap-1 text-[15px] font-semibold"
      >
        @{active?.username}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className="text-muted-foreground size-3.5"
        />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("Switch profile")}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col px-4 pb-6">
            {identities.map((identity) => (
              <button
                key={identity.id}
                type="button"
                disabled={isPending}
                onClick={() => select(identity.id)}
                className="border-border/60 flex items-center gap-3 border-b py-3 disabled:opacity-50"
              >
                <Avatar>
                  {identity.image && (
                    <AvatarImage src={identity.image} alt={identity.name} />
                  )}
                  <AvatarFallback>{identity.name}</AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col text-start leading-tight">
                  <span className="text-foreground text-[13.5px] font-medium">
                    {identity.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    @{identity.username}
                  </span>
                </div>
                {identity.id === activeId && (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    className="text-primary size-4 shrink-0"
                  />
                )}
              </button>
            ))}

            <button
              type="button"
              disabled={isPending}
              onClick={addBusiness}
              className="flex items-center gap-3 py-3 disabled:opacity-50"
            >
              <span className="border-muted-foreground/40 text-muted-foreground flex size-8 items-center justify-center rounded-full border border-dashed">
                <HugeiconsIcon icon={Add01Icon} className="size-4" />
              </span>
              <span className="text-foreground text-[13.5px] font-medium">
                {t("Add a business profile")}
              </span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
