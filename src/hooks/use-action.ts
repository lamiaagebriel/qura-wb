"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";

type Options<R> = {
  /** The toast once the server said yes; none by default. */
  success?: MessageKey;
  onDone?: (data: R) => void;
  /** After the error toast: undo an optimistic change. */
  onError?: () => void;
  /** Re-render the screen after it worked (default). Off for optimistic UI. */
  refresh?: boolean;
};

/**
 * Runs a one-tap server action (delete, follow, vote, report…) — the
 * counterpart of `useActionForm` for actions without a form. An error is a
 * toast; offline or a crash says nothing was saved. `run` resolves to
 * whether it worked, so a sheet can stay open on failure.
 */
export function useAction() {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run<R>(
    action: () => Promise<ActionResult<R>>,
    { success, onDone, onError, refresh = true }: Options<R> = {},
  ): Promise<boolean> {
    setPending(true);
    try {
      const result = await action();
      if (!result.ok) {
        toast.add({ title: t(result.error), type: "error" });
        onError?.();
        return false;
      }
      if (success) toast.add({ title: t(success) });
      if (refresh) router.refresh();
      onDone?.(result.data);
      return true;
    } catch {
      toast.add({ title: t("Not saved. Check your connection and try again."), type: "error" });
      onError?.();
      return false;
    } finally {
      setPending(false);
    }
  }

  return { run, pending, t };
}
