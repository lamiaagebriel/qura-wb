import NextImage from "next/image";
import { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/shadcn";

export type ImageProps = {} & ComponentPropsWithoutRef<typeof NextImage>;
export function Image({ className, src, alt, ...props }: ImageProps) {
	return (
		<NextImage
			src={src ?? "https://ui.shadcn.com/placeholder.svg"}
			alt={alt ?? ""}
			width={999999999999999}
			height={999999999999999}
			className={cn(
				"bg-muted h-full w-full rounded-md border object-cover object-center transition-colors",
				className,
			)}
			{...props}
		/>
	);
}
