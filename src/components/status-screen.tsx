import type { ReactNode } from "react";

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
}: {
  icon: IconSvgElement;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
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
    </main>
  );
}
