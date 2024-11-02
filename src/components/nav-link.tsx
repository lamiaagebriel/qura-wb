"use client";
import { NavItem } from "@/types";
import { Link, LinkProps } from "./link";
import { cn } from "@/lib/utils";
import { useSelectedLayoutSegment } from "next/navigation";

type NavLinkProps = { segments: NavItem["segments"]; activeClassNames?: string } & LinkProps;
export function NavLink({ segments, activeClassNames, className, ...props }: NavLinkProps) {
	const segment = useSelectedLayoutSegment();

	return (
		<Link
			className={cn(
				className,
				segment === segments || segments?.some((e) => segment === e) ? activeClassNames : "",
			)}
			{...props}
		/>
	);
}
