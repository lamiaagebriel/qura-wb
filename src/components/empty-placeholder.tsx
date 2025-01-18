import React from "react";

import { cn } from "@/lib/utils";

import { IconProps, Icons } from "./icons";

type EmptyPlaceholderProps = React.HTMLAttributes<HTMLDivElement>;
export function EmptyPlaceholder({
  className,
  children,
  ...props
}: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

type EmptyPlaceholderIconProps = IconProps & {
  name: keyof typeof Icons;
};

export function EmptyPlaceHolderIcon({
  name,
  className,
  ...props
}: EmptyPlaceholderIconProps) {
  const Icon = Icons[name];

  if (!Icon) return null;

  return (
    <div className="flex size-20 items-center justify-center rounded-full bg-muted">
      <Icon
        className={cn("size-10 text-muted-foreground", className)}
        {...props}
      />
    </div>
  );
}

export function EmptyPlaceholderTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("mt-6 text-xl font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function EmptyPlaceholderDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "mb-6 mt-2 max-w-prose text-center text-sm font-normal leading-6 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
