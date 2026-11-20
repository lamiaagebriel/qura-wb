"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Mode,
  type Path,
  type Resolver,
} from "react-hook-form";

import { toast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";

/**
 * A react-hook-form form that runs a server action on submit: the schema
 * checks it first, the server's `field` error lands under that field
 * (anything else is a toast), and the success toast and `onDone` come only
 * after the server said yes. `T`: the form's values, `V`: after the schema
 * (when it transforms them), `R`: what the action returns.
 */
export function useActionForm<T extends FieldValues, R, V extends FieldValues = T>({
  schema,
  defaultValues,
  action,
  onDone,
  success = "Saved",
  mode,
}: {
  schema: Parameters<typeof zodResolver>[0];
  defaultValues: DefaultValues<T>;
  action: (values: V) => Promise<ActionResult<R>>;
  onDone?: (data: R) => void;
  /** The success toast; `null` for none. */
  success?: MessageKey | null;
  mode?: Mode;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<T, unknown, V>({
    resolver: zodResolver(schema) as unknown as Resolver<T, unknown, V>,
    defaultValues,
    mode,
  });
  const submit = form.handleSubmit((values) =>
    start(async () => {
      // The keyboard closes on submit (native feel).
      (document.activeElement as HTMLElement | null)?.blur();
      try {
        const result = await action(values);
        if (!result.ok) {
          if (!result.field) return void toast.add({ title: t(result.error), type: "error" });
          return form.setError(result.field as Path<T>, { message: result.error }, { shouldFocus: true });
        }
        if (success) toast.add({ title: t(success) });
        router.refresh();
        onDone?.(result.data);
      } catch {
        // Offline or the server fell over: nothing was saved, say so.
        toast.add({ title: t("Not saved. Check your connection and try again."), type: "error" });
      }
    }),
  );
  return { form, submit, pending, t };
}
