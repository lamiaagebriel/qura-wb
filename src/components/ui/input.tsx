"use client";

import * as React from "react";

import { cva, VariantProps } from "class-variance-authority";

import { cn, fileToBase64 } from "@/lib/utils";

import { Icons } from "@/components/icons";

import { withFormAwareness } from "./form";

export const inputVariants = cva(
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
);

export type InputProps = React.ComponentProps<"input"> &
  React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants> & {};

const InputWithoutFormAwareness = React.forwardRef<
  HTMLInputElement,
  InputProps
>(({ type = "text", className, onChange, value, multiple, ...props }, ref) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  if (type === "password") {
    return (
      <div className="relative">
        <input
          ref={ref}
          onChange={onChange}
          value={value ?? ""}
          multiple={multiple}
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
        onChange={onChange}
        value={value ?? ""}
        multiple={multiple}
        className={cn(inputVariants({ className }))}
        dir="ltr"
        placeholder="name@example.com"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect="off"
        {...props}
      />
    );

  if (type === "file")
    return (
      <input
        ref={ref}
        type={type}
        className={cn(inputVariants({ className }))}
        value={undefined}
        multiple={multiple}
        onChange={async (e) => {
          const files = e?.target?.files;
          if (!files || !files.length) return null;

          const fileBase64 = await Promise.all(
            Array.from(files).map((file) =>
              fileToBase64(file)?.then((r) => r?.toString() as string)
            )
          );

          onChange?.({
            ...e,
            target: {
              ...e?.target,
              // TODO: handle multiple files
              value: multiple
                ? (fileBase64 as any)
                : fileBase64?.length === 1 && fileBase64?.[0]
                  ? fileBase64?.[0]
                  : "",
            },
          });
        }}
        {...props}
      />
    );

  return (
    <input
      ref={ref}
      type={type}
      onChange={onChange}
      multiple={multiple}
      value={value ?? ""}
      className={cn(inputVariants({ className }))}
      {...props}
    />
  );
});
InputWithoutFormAwareness.displayName = "Input";
const Input = withFormAwareness(InputWithoutFormAwareness);

export { Input };
