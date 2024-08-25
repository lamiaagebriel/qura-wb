"use client";

import { Icons } from "@/components/icons";
import { Link } from "@/components/link";
import { Tooltip } from "@/components/tooltip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";
import { useSelectedLayoutSegment } from "next/navigation";

type SideNavProps = {
  isCollapsed: boolean;
  links: NavItem[];
};

export function SideNav({ links, isCollapsed }: SideNavProps) {
  const segment = useSelectedLayoutSegment();

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, i) => {
          const Icon = link?.["icon"] ? Icons?.[link?.["icon"]!] : null;

          return isCollapsed ? (
            <Tooltip
              key={i}
              side="right"
              className="flex items-center justify-between gap-4"
              text={
                <div className="flex items-center justify-between gap-6">
                  <span>{link?.["label"]}</span>

                  {link?.["indicator"] && (
                    <span className="text-muted-foreground">
                      {link?.["indicator"]}
                    </span>
                  )}
                </div>
              }
            >
              <div>
                <Link
                  href={link?.["value"]}
                  className={cn(
                    "h-9 w-9",
                    buttonVariants({
                      variant:
                        segment === link?.["segment"] ||
                        link?.["segment"]?.some((e) => segment === e)
                          ? "default"
                          : "ghost",
                      size: "icon",
                    }),

                    segment === link?.["segment"] ||
                      (link?.["segment"]?.some((e) => segment === e) &&
                        "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white")
                  )}
                >
                  {Icon && <Icon />}
                  <span className="sr-only">{link?.["label"]}</span>
                </Link>
              </div>
            </Tooltip>
          ) : (
            <Link
              key={i}
              href={link?.["value"]}
              className={cn(
                buttonVariants({
                  variant:
                    segment === link?.["segment"] ||
                    link?.["segment"]?.some((e) => segment === e)
                      ? "default"
                      : "ghost",
                  size: "sm",
                }),
                segment === link?.["segment"] ||
                  (link?.["segment"]?.some((e) => segment === e) &&
                    "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white"),
                "justify-between"
              )}
            >
              <div className="flex items-center gap-2">
                {Icon && <Icon />}
                {link?.["label"]}
              </div>
              {link?.["indicator"] && (
                <span
                  className={cn(
                    segment === link?.["segment"] ||
                      (link?.["segment"]?.some((e) => segment === e) &&
                        "text-background dark:text-white")
                  )}
                >
                  {link?.["indicator"]}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
