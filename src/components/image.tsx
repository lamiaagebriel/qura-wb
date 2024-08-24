import { cn } from "@/lib/utils";
import NextImage from "next/image";
import { ComponentPropsWithoutRef } from "react";

export type ImageProps = {} & ComponentPropsWithoutRef<typeof NextImage>;

export function Image({ className, src, alt, ...props }: ImageProps) {
  return (
    <NextImage
      src={src ?? "https://source.boringavatars.com/marble/120"}
      alt={alt ?? ""}
      width={999999999999999}
      height={999999999999999}
      className={cn(
        "h-full w-full rounded-md border bg-muted object-cover object-center transition-colors",
        className
      )}
      {...props}
    />
  );
}
