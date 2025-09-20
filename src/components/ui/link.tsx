"use client";

import NextLink from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import * as React from "react";

import { NavItem } from "@/types";

import { cn } from "@/lib/utils";

type LinkProps = {
  href: string;
  disabled?: boolean;
} & React.ComponentPropsWithoutRef<typeof NextLink>;
const Link = React.forwardRef<React.ElementRef<typeof NextLink>, LinkProps>(
  ({ href, className, disabled, ...props }, ref) => {
    const isInternalLink = href?.startsWith("/");
    const isAnchorLink = href?.startsWith("#");

    if (isInternalLink || isAnchorLink) {
      return (
        <NextLink
          ref={ref}
          href={disabled ? "#" : href}
          className={cn(disabled && "cursor-not-allowed opacity-70", className)}
          {...props}
        />
      );
    }

    return (
      <NextLink
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("items-center gap-2 underline", className)}
        {...props}
      />
    );
  }
);
Link.displayName = "Link";

type NavLinkProps = {
  activeClassNames?: string;
} & Pick<NavItem, "segments"> &
  LinkProps;

const NavLink = React.forwardRef<React.ElementRef<typeof Link>, NavLinkProps>(
  ({ segments, activeClassNames, className, ...props }, ref) => {
    const segment = useSelectedLayoutSegment();

    return (
      <Link
        ref={ref}
        className={cn(
          className,
          segments?.some((e) => segment === e) ? activeClassNames : ""
        )}
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { Link, NavLink, type LinkProps, type NavLinkProps };
