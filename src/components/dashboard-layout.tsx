import * as React from "react";

import { cn } from "@/lib/utils";

type DashboardLayoutProps = {} & React.HTMLAttributes<HTMLDivElement>;

export function DashboardLayout({
  className,
  children,
  ...props
}: DashboardLayoutProps) {
  return (
    <div
      className={cn("container max-w-screen-lg flex-1", className)}
      {...props}
    >
      {children}
    </div>
  );
}

type DashboardLayoutHeaderProps = {} & React.HTMLAttributes<HTMLHeadingElement>;

DashboardLayout.Header = function DashboardLayoutHeader({
  className,
  ...props
}: DashboardLayoutHeaderProps) {
  return (
    <div
      className={cn("my-6 flex items-center justify-between", className)}
      {...props}
    />
  );
};

type DashboardLayoutTitleProps = {} & React.HTMLAttributes<HTMLHeadingElement>;

DashboardLayout.Title = function DashboardLayoutTitle({
  className,
  ...props
}: DashboardLayoutTitleProps) {
  return (
    // <h2 className={cn("mt-6 text-xl font-semibold", className)} {...props} />

    <h2
      className={cn("text-2xl font-bold tracking-tight", className)}
      {...props}
    />
  );
};

type DashboardLayoutDescriptionProps =
  {} & React.HTMLAttributes<HTMLParagraphElement>;

DashboardLayout.Description = function DashboardLayoutDescription({
  className,
  ...props
}: DashboardLayoutDescriptionProps) {
  return (
    <p
      className={cn("max-w-prose text-sm text-muted-foreground", className)}
      {...props}
    />
    //   <p
    //   className={cn(
    //     "mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground",
    //     className
    //   )}
    //   {...props}
    // />
  );
};
