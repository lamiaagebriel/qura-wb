"use client";

import * as React from "react";

import { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import {
  withFormAwareness,
  WithFormAwarenessProps,
} from "@/components/ui/form";
import { inputVariants } from "@/components/ui/vairants";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  React.ComponentProps<"input"> &
  VariantProps<typeof inputVariants> &
  WithFormAwarenessProps & {};

const Input = withFormAwareness(
  React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = "text", ...props }, ref) => {
      return (
        <input
          ref={ref}
          type={type}
          className={cn(inputVariants({ className }))}
          {...props}
        />
      );
    }
  )
);
Input.displayName = "Input";

export { Input };
