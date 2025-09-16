import React from "react";

import { cn } from "@/lib/utils";

import { IconProps, Icons } from "@/components/ui/icons";

type EmptyPlaceholderProps = React.HTMLAttributes<HTMLDivElement>;
export function EmptyPlaceholder({
  className,
  children,
  ...props
}: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in-50 flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center",
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

export function EmptyPlaceholderIcon({
  name,
  className,
  ...props
}: EmptyPlaceholderIconProps) {
  const Icon = Icons[name];

  if (!Icon) return null;

  return (
    <div className="bg-muted flex size-20 items-center justify-center rounded-full">
      <Icon
        className={cn("text-muted-foreground size-10", className)}
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
      className={cn("text-foreground mt-6 text-xl font-semibold", className)}
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
        "text-muted-foreground mt-2 mb-6 max-w-prose text-center text-sm leading-6 font-normal",
        className
      )}
      {...props}
    />
  );
}
