import { cn } from "@/lib/utils";

import { Tooltip as ToolTip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TooltipProps = {
	children: React.ReactNode;
	tip: React.ReactNode;
} & React.ComponentProps<typeof TooltipContent>;

export function Tooltip({ children, tip, className, ...props }: TooltipProps) {
	return (
		<ToolTip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent className={cn(className)} {...props}>
				{tip}
			</TooltipContent>
		</ToolTip>
	);
}
