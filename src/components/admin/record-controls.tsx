"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteRecord, runRecordAction } from "@/components/admin/record-actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { tableHref } from "@/lib/admin/links";
import type { RecordAction } from "@/lib/admin/types";
import { useLocale } from "@/lib/i18n/provider";

/** A record's actions (approve, suspend, hide…): one click, or a dialog first. */
export function RecordActions({
  resource,
  id,
  actions,
}: {
  resource: string;
  id: string;
  actions: RecordAction[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState<RecordAction | null>(null);
  const [input, setInput] = useState("");

  const run = (action: RecordAction, text = "") =>
    startTransition(async () => {
      const result = await runRecordAction(resource, id, action.key, text);
      if (!result.ok) {
        toast.add({ title: t(result.error), type: "error" });
        return;
      }
      toast.add({ title: t("Done: {{action}}", { action: action.label }) });
      setAsking(null);
      setInput("");
      router.refresh();
    });

  if (!actions.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.key}
          variant={action.tone === "destructive" ? "destructive" : "outline"}
          className="h-11 md:h-9"
          disabled={pending}
          onClick={() => (action.confirm ? setAsking(action) : run(action))}
        >
          {action.label}
        </Button>
      ))}
      <AlertDialog
        open={asking !== null}
        onOpenChange={(open) => {
          if (open || pending) return;
          setAsking(null);
          setInput("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{asking?.confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{asking?.confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {asking?.confirm?.input && (
            <Field>
              <FieldLabel htmlFor="action-input">{asking.confirm.input}</FieldLabel>
              <Textarea
                id="action-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={500}
                dir="auto"
                className="min-h-20"
              />
            </Field>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("Cancel")}</AlertDialogCancel>
            <Button
              variant={asking?.tone === "destructive" ? "destructive" : "default"}
              disabled={
                pending ||
                (!!asking?.confirm?.input && !input.trim()) ||
                // A typed confirmation: exactly the text asked for.
                (asking?.confirm?.match !== undefined && input.trim() !== asking.confirm.match)
              }
              onClick={() => asking && run(asking, input.trim())}
            >
              {pending && <Spinner />}
              {asking?.label}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * Deleting for good: says what goes with it, and asks to type a word
 * (so it can't be a slip). Back to the table afterwards.
 */
export function DeleteRecord({
  resource,
  id,
  warning,
  confirmWord,
}: {
  resource: string;
  id: string;
  warning: string;
  confirmWord: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <section
      aria-labelledby="danger"
      className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-1">
        <h2 id="danger" className="font-semibold text-destructive">
          {t("Delete for good")}
        </h2>
        <p className="text-sm text-muted-foreground">{warning}</p>
      </div>
      <Button variant="destructive" className="h-11 shrink-0 md:h-9" onClick={() => setOpen(true)}>
        {t("Delete")}
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (pending) return;
          setOpen(next);
          if (!next) setTyped("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete for good?")}</AlertDialogTitle>
            <AlertDialogDescription>{warning}</AlertDialogDescription>
          </AlertDialogHeader>
          <Field>
            <FieldLabel htmlFor="confirm-word">
              {t("Type “{{word}}” to confirm", { word: confirmWord })}
            </FieldLabel>
            <Input
              id="confirm-word"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
            />
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("Cancel")}</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={pending || typed.trim().toLowerCase() !== confirmWord.toLowerCase()}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteRecord(resource, id);
                  if (!result.ok) {
                    toast.add({ title: t(result.error), type: "error" });
                    return;
                  }
                  toast.add({ title: t("Deleted") });
                  router.replace(tableHref(resource));
                })
              }
            >
              {pending && <Spinner />}
              {t("Delete")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
