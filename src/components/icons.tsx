import { cva, VariantProps } from "class-variance-authority";
import { Globe, type LucideProps } from "lucide-react";
import { cn } from "@/lib/shadcn";

export const IconsVariants = cva("size-4 shrink-0");
export type IconProps = {} & LucideProps & VariantProps<typeof IconsVariants>;
export type Icon = keyof typeof Icons;

export const Icons = {
	globe: ({ className, ...props }: IconProps) => (
		<Globe className={cn(IconsVariants({}), className)} {...props} />
	),
};
