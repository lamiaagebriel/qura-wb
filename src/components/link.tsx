"use client";
import NextLink from "next/link";
import { ComponentPropsWithoutRef } from "react";

import { Icons } from "@/components/icons";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

export type LinkProps = ComponentPropsWithoutRef<typeof NextLink> & {
  href: string;
  disabled?: boolean;
};

export function Link({
  href,
  className,
  disabled,
  children,
  ...props
}: LinkProps) {
  const lang = useLocale();
  const isInternalLink = href.startsWith("/");
  const isAnchorLink = href.startsWith("#");

  if (isInternalLink || isAnchorLink) {
    return (
      <NextLink
        locale={lang}
        href={disabled ? "#" : `/${lang}${href}`}
        className={cn(disabled && "cursor-not-allowed opacity-70", className)}
        {...props}
      >
        {children}
      </NextLink>
    );
  }

  return (
    <NextLink
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("items-center gap-2 underline", className)}
      {...props}
    >
      {children}
      <Icons.externalLink className="inline-block" />
    </NextLink>
  );
}
