"use client";

import * as React from "react";
import NextLink from "next/link";

import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/shadcn";

import { NavItem } from "@/types";
import { useSelectedLayoutSegment } from "next/navigation";

type LocaleLinkProps = { href: string; disabled?: boolean } & React.ComponentPropsWithoutRef<
	typeof NextLink
>;
const LocaleLink = React.forwardRef<React.ElementRef<typeof NextLink>, LocaleLinkProps>(
	({ href, className, disabled, children, ...props }, ref) => {
		const lang = useLocale();
		const isInternalLink = href?.startsWith("/");
		const isAnchorLink = href?.startsWith("#");

		if (isInternalLink || isAnchorLink) {
			return (
				<NextLink
					ref={ref}
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
				ref={ref}
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={cn("items-center gap-2 underline", className)}
				{...props}
			>
				{children}
				{/* <Icons.externalLink className="inline-block" /> */}
			</NextLink>
		);
	},
);

LocaleLink.displayName = "LocaleLink";

type NavLinkProps = {
	activeClassNames?: string;
} & Pick<NavItem, "segments"> &
	LocaleLinkProps;

const NavLink = React.forwardRef<React.ElementRef<typeof LocaleLink>, NavLinkProps>(
	({ segments, activeClassNames, className, ...props }, ref) => {
		const segment = useSelectedLayoutSegment();

		return (
			<LocaleLink
				ref={ref}
				className={cn(className, segments?.some((e) => segment === e) ? activeClassNames : "")}
				{...props}
			/>
		);
	},
);

NavLink.displayName = "NavLink";

export { LocaleLink, type LocaleLinkProps, NavLink, type NavLinkProps };
