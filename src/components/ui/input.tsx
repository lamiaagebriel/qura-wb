"use client";

import * as React from "react";

import { cva, VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { Icons } from "@/components/icons";

export const inputVariants = cva(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
);

export type InputProps = React.ComponentProps<"input"> &
  React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants> & {};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type = "text", className, ...props }, ref) => {
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
              <Icons.eyeOff className="size-3" />
            ) : (
              <Icons.eye className="size-3" />
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
);
Input.displayName = "Input";

export { Input };
