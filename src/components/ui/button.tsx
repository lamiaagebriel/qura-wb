"use client";

import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import {
  withFormAwareness,
  WithFormAwarenessProps,
} from "@/components/ui/form";
import { buttonVariants } from "@/components/ui/vairants";

import { Icons } from "../icons";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> &
  WithFormAwarenessProps & {
    asChild?: boolean;
    Icon?: React.ReactNode;
  };

const Button = withFormAwareness(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
      {
        variant,
        size,

        asChild = false,
        loading = false,
        disabled,
        Icon,

        type = "button",
        className,
        children,
        ...props
      },
      ref
    ) => {
      const Comp = asChild ? Slot : "button";

      return (
        <Comp
          ref={ref}
          type={type}
          disabled={disabled}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        >
          {type === "submit" && loading ? <Icons.spinner /> : Icon}
          {children}
        </Comp>
      );
    }
  )
);
Button.displayName = "Button";

export { Button };
