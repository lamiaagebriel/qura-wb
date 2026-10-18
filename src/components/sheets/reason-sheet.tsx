"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import { SheetFrame } from "./action-sheet";

/**
 * A confirmation that asks why, as a bottom sheet: a text box (optional
 * unless `required`) and the confirm button. `onConfirm` gets the text and
 * may be async; return `false` to keep the sheet open.
 */
export function ReasonSheet({
  open,
  onOpenChange,
  title,
  description,
  label,
  confirmLabel,
  destructive = false,
  required = false,
  maxLength = 500,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** The text box's label (shown to screen readers and as placeholder). */
  label: string;
  confirmLabel: string;
  destructive?: boolean;
  required?: boolean;
  maxLength?: number;
  onConfirm: (reason: string) => boolean | void | Promise<boolean | void>;
}) {
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <SheetFrame
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) setReason("");
        onOpenChange(next);
      }}
      title={title}
      description={description}
      cancelDisabled={pending}
    >
      <Textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        aria-label={label}
        placeholder={label}
        maxLength={maxLength}
        enterKeyHint="done"
        dir="auto"
        className="min-h-24 resize-none rounded-xl px-3 text-base md:text-base"
      />
      <Button
        size="xl"
        variant={destructive ? "destructive" : "default"}
        className="w-full rounded-2xl text-base"
        disabled={pending || (required && !reason.trim())}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            if ((await onConfirm(reason.trim())) === false) return;
            setReason("");
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
