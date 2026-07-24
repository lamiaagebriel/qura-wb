"use client";

import { LogOut } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth/actions/sign-out";
import { useLocale } from "@/lib/i18n/client";
import Link from "next/link";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserNav({
  user,
}: {
  user: { name: string; email: string; image?: string | null | undefined };
}) {
  const { t } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-muted focus-visible:ring-ring/30 flex items-center gap-2 rounded-full py-1 ps-1 pe-3 transition-colors outline-none focus-visible:ring-2">
        <span className="border-border bg-muted text-foreground flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border text-[11px] font-semibold">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="size-full object-cover"
            />
          ) : (
            getInitials(user.name)
          )}
        </span>
        <span className="hidden text-[13px] font-medium sm:inline">
          {user.name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5">
          <span className="text-foreground truncate text-[13px] font-medium">
            {user.name}
          </span>
          <span className="text-muted-foreground truncate text-[11px] font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/dashboard">{t("Dashboard")}</Link>
        </DropdownMenuItem>
        <form action={signOutAction} className="contents">
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className="w-full">
              <LogOut />
              {t("Sign out")}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
