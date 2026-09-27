import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { HugeiconsIcon, type IconSvgElement } from "@/components/icons";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/** Full-screen message with an icon and actions (errors, not found...). */
export function StatusScreen({
  icon,
  title,
  description,
  children,
  inline = false,
}: {
  icon: IconSvgElement;
  title: string;
  description: string;
  children?: ReactNode;
  /** Inside a page (fills the available space) instead of full-screen. */
  inline?: boolean;
}) {
  const Wrapper = inline ? "div" : "main";
  return (
    <Wrapper
      className={cn(
        "flex flex-col items-center justify-center",
        inline
          ? "flex-1 py-10"
          : "min-h-(--app-height) px-6 pt-(--safe-top) pb-(--safe-bottom)",
      )}
    >
      <Empty className="max-w-md animate-in fade-in duration-500 motion-reduce:animate-none">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {children && (
          <EmptyContent className="w-full max-w-xs">{children}</EmptyContent>
        )}
      </Empty>
    </Wrapper>
  );
}
