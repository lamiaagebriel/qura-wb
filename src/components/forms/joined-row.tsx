"use client";

// Rows of an input and its buttons joined into one field (links, branches, hours).



import { Delete02Icon, HugeiconsIcon, PlusSignIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";


// A row of input + buttons joined together, looking like one field: the
// app's rounder ends (beats ButtonGroup's own end radius) and the inputs'
// background on the buttons too.
export const JOINED =
  "w-full [&>*:first-child]:rounded-s-xl! [&>[data-slot]:not(:has(~[data-slot])):last-child]:rounded-e-xl! [&>button]:bg-input/20 dark:[&>button]:bg-input/30";

/** The "remove this row" end of a joined row. */
export function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      onClick={onClick}
      className="size-11 shrink-0 text-muted-foreground"
    >
      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-5" />
    </Button>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="xl"
      onClick={onClick}
      className="w-full rounded-xl text-sm"
    >
      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} />
      {label}
    </Button>
  );
}
