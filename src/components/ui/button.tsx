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

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> &
  WithFormAwarenessProps & { asChild?: boolean };

const Button = withFormAwareness(
  React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
      { variant, size, className, asChild = false, type = "button", ...props },
      ref
    ) => {
      const Comp = asChild ? Slot : "button";
      return (
        <Comp
          ref={ref}
          type={type}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        />
      );
    }
  )
);
Button.displayName = "Button";

export { Button };
