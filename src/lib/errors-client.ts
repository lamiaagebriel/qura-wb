"use client";

import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import type { AppError } from "@/lib/errors";

/**
 * Single place every client component funnels a server action's `AppError`
 * through. A plain `message` always becomes a toast. `issues` are routed
 * per-issue: if a `form` was passed and the issue's path targets one of
 * *that* form's actual fields, it becomes a field error (`form.setError`) so
 * it renders inline next to the input; anything else — no form, empty path,
 * a path this form doesn't have a field for — falls back to a toast so it's
 * never silently dropped.
 */
export function handleAppError<T extends FieldValues>(
  error: AppError,
  form?: UseFormReturn<T>,
) {
  if (error.kind === "message") {
    toast.error(error.message);
    return;
  }

  const knownFields = form ? new Set(Object.keys(form.getValues())) : null;

  for (const issue of error.issues) {
    const topKey = issue.path[0] !== undefined ? String(issue.path[0]) : "";
    const targetsThisForm = !!knownFields && topKey !== "" && knownFields.has(topKey);

    if (form && targetsThisForm) {
      const name = issue.path.join(".") as Path<T>;
      form.setError(name, { message: issue.message });
    } else {
      toast.error(issue.message);
    }
  }
}
