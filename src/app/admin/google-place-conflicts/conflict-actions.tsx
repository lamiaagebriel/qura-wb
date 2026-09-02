"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  dismissGooglePlaceConflictAction,
  resolveGooglePlaceConflictAction,
} from "@/lib/admin/actions/resolve-conflict";
import { handleAppError } from "@/lib/errors-client";
import type { ActionResult } from "@/lib/errors";

export function ConflictActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (action: (id: string) => Promise<ActionResult>) => {
    startTransition(async () => {
      const result = await action(id);
      if (!result.success) {
        handleAppError(result.error);
        return;
      }
      router.refresh();
    });
  };

  if (status !== "conflict") return null;

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        disabled={isPending}
        onClick={() => run(resolveGooglePlaceConflictAction)}
      >
        Resolve
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => run(dismissGooglePlaceConflictAction)}
      >
        Dismiss
      </Button>
    </div>
  );
}
