import { cva, VariantProps } from "class-variance-authority";
import { Loader2, type LucideProps } from "lucide-react";

import { cn } from "@/lib/utils";

export const IconsVariants = cva("size-3 shrink-0");
export type IconProps = {} & LucideProps & VariantProps<typeof IconsVariants>;
export type Icon = keyof typeof Icons;

export const Icons = {
  spinner: ({ className, ...props }: IconProps) => (
    <Loader2
      className={cn(IconsVariants({}), "animate-spin", className)}
      {...props}
    />
  ),
};
