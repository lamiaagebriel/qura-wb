import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * One row of a card list (settings, a sheet's options): built on the shadcn
 * button style, so its text, focus and pressed states follow the preset.
 * Server-safe (a plain class string), for buttons, links and plain rows alike.
 */
export const LIST_ROW = cn(
  buttonVariants({ variant: "ghost" }),
  "min-h-14 w-full justify-between gap-4 rounded-none px-4 py-2 text-start font-normal whitespace-normal",
  // The list's divider (the button style's own transparent border would hide it).
  "border-x-0 border-t-0 border-b-border/60 last:border-b-0",
);

/** A row that isn't tappable itself (it holds its own controls): no hover or press. */
export const STATIC_ROW = cn(LIST_ROW, "hover:bg-transparent active:not-aria-[haspopup]:translate-y-0");
