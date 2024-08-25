"use client";

import { Link } from "@/components/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";

type SidebarNavProps = React.HTMLAttributes<HTMLElement> & {
  items: NavItem[];
};

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const segment = useSelectedLayoutSegment();

  return (
    <nav className={cn("flex flex-col gap-1", className)} {...props}>
      {items.map((item, i) => (
        <Link
          key={i}
          href={item?.["value"]}
          className={cn(
            buttonVariants({
              variant:
                segment === item?.["segment"] ||
                item?.["segment"]?.some((e) => segment === e)
                  ? "secondary"
                  : "ghost",
            }),
            "justify-start"
          )}
        >
          {item?.["label"]}
        </Link>
      ))}
    </nav>
  );
}
