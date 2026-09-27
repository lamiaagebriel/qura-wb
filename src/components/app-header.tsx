import type { ReactNode } from "react";

/** Sticky, frosted top bar for tab screens (sits below the notch). */
export function AppHeader({
  title,
  children,
}: {
  title?: ReactNode;
  /** Extra content under the title row, e.g. a search field. */
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 pt-(--safe-top) backdrop-blur-xl">
      <div className="mx-auto flex max-w-md flex-col gap-2 px-4 pb-3">
        {title && (
          <h1 className="flex h-12 items-end font-heading text-2xl font-semibold tracking-tight">
            {title}
          </h1>
        )}
        {children}
      </div>
    </header>
  );
}
