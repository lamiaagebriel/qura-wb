"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { Button as MotionButton } from "@/components/animate-ui/primitives/buttons/button";
import { Delete02Icon, HugeiconsIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// How long the second step waits before it gives up.
const ARMED_MS = 3000;

/**
 * A two-step button for small destructive actions (deleting your reply or
 * review): the first tap turns it red and asks ("Delete?"), a second tap
 * within 3 seconds does it; otherwise, or on leaving it, it goes back.
 * Springs on press (animate-ui's Button); the label swaps with a quick slide.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className,
  icon = false,
}: {
  label: string;
  /** The second step's question, e.g. "Delete?". */
  confirmLabel: string;
  onConfirm: () => unknown;
  className?: string;
  /** Just the trash icon until the first tap opens it into the question. */
  icon?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), ARMED_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  return (
    <MotionButton
      type="button"
      aria-live="polite"
      // Icon only: the label names it until it asks.
      aria-label={icon && !armed ? label : undefined}
      disabled={busy}
      onBlur={() => setArmed(false)}
      onClick={async () => {
        if (!armed) return setArmed(true);
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "h-11 gap-1.5 overflow-hidden px-3 font-semibold text-muted-foreground transition-colors",
        armed &&
          "bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive",
        className,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={armed ? "armed" : "idle"}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="flex items-center gap-1.5"
        >
          {(armed || icon) && <HugeiconsIcon icon={Delete02Icon} className="size-4" />}
          {armed ? confirmLabel : icon ? null : label}
        </motion.span>
      </AnimatePresence>
    </MotionButton>
  );
}
