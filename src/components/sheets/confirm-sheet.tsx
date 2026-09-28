"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { SheetFrame } from "./action-sheet";

/**
 * Confirmation as a bottom sheet — never `window.confirm()`. `onConfirm` may
 * be async: the button shows a spinner and the sheet closes when it's done.
 *   <ConfirmSheet open={open} onOpenChange={setOpen} title="Delete post?"
 *     confirmLabel="Delete" destructive onConfirm={deletePost} />
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <SheetFrame
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      title={title}
      description={description}
      cancelDisabled={pending}
    >
      <Button
        size="xl"
        variant={destructive ? "destructive" : "default"}
        className="w-full rounded-2xl text-base"
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            await onConfirm();
            onOpenChange(false);
          })
        }
      >
        {pending && <Spinner />}
        {confirmLabel}
      </Button>
    </SheetFrame>
  );
}
