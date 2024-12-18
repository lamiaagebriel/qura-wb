"use client";

import * as React from "react";

import { VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";

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
      const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

      if (type === "password") {
        return (
          <div className="relative">
            <input
              type={isPasswordVisible ? "text" : "password"}
              className={cn(
                inputVariants({ className }),
                "pr-10" // Add space for the eye icon
              )}
              dir="ltr"
              placeholder="******"
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect="off"
              ref={ref}
              {...props}
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            >
              {isPasswordVisible ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        );
      }

      if (type === "email")
        return (
          <input
            ref={ref}
            type={type}
            className={cn(inputVariants({ className }))}
            dir="ltr"
            placeholder="name@example.com"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect="off"
            {...props}
          />
        );

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
