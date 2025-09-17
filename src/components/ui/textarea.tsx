import * as React from "react";

import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

import { withFormAwareness } from "./form";

export const inputVariants = cva(
  "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
);

export type TextareaProps = React.ComponentProps<"textarea">;
function TextareaWithoutFormAwareness({ className, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(inputVariants({}), className)}
      {...props}
    />
  );
}
const Textarea = withFormAwareness(TextareaWithoutFormAwareness);
export { Textarea };
