import NextImage from "next/image";
import * as React from "react";

import { cn } from "@/lib/utils";

type ImageProps = {} & React.ComponentPropsWithoutRef<typeof NextImage>;
const Image = React.forwardRef<React.ElementRef<typeof NextImage>, ImageProps>(
  ({ src, alt, className, ...props }, ref) => {
    return (
      <NextImage
        ref={ref}
        src={src ?? "https://ui.shadcn.com/placeholder.svg"}
        alt={alt ?? ""}
        width={999999999999999}
        height={999999999999999}
        className={cn(
          "bg-muted h-full w-full border object-cover object-center transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);
Image.displayName = "Image";

export { Image, type ImageProps };
