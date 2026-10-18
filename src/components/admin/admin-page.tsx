import Link from "next/link";
import type { ReactNode } from "react";

import {
  ArrowLeft01Icon,
  HugeiconsIcon,
  type IconSvgElement,
} from "@/components/icons";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * One dashboard screen: a sticky top bar (sidebar toggle, and a way back
 * on record pages), then the screen's title row — its section icon, name,
 * count and actions — over full-width content.
 */
export function AdminPage({
  title,
  description,
  actions,
  icon,
  tint,
  count,
  back,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** The section's icon, tinted with its color. */
  icon?: IconSvgElement;
  tint?: string;
  /** How many rows (tables). */
  count?: number;
  /** A record page's table: `{ href, label }`. */
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b bg-background/80 px-4 pt-(--safe-top) backdrop-blur-md">
        <SidebarTrigger className="-ms-1 size-11 md:size-8" />
        <Separator
          orientation="vertical"
          className="me-1 data-vertical:h-5 data-vertical:self-center"
        />
        {back ? (
          <Link
            href={back.href}
            className="flex h-11 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground hover:text-foreground md:h-8"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4 rtl:rotate-180" />
            {back.label}
          </Link>
        ) : (
          <span className="truncate text-sm text-muted-foreground">{title}</span>
        )}
      </header>
      <div className="flex flex-1 flex-col gap-6 p-4 pb-[calc(--spacing(6)+var(--safe-bottom))] md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          {icon && (
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl bg-current/10",
                tint,
              )}
            >
              <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="flex items-baseline gap-2 text-xl font-bold tracking-tight">
              <span className="truncate">{title}</span>
              {count !== undefined && (
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  {count.toLocaleString()}
                </span>
              )}
            </h1>
            {description && <div className="text-sm text-muted-foreground">{description}</div>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </>
  );
}
