"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { INPUT } from "@/components/form";
import {
  cancelPlaceRequest,
  requestAdminChange,
  resolvePlaceRequest,
  type PlaceResult,
} from "@/components/places/place-actions";
import { ConfirmSheet } from "@/components/sheets/confirm-sheet";
import { ReasonSheet } from "@/components/sheets/reason-sheet";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/types";

/** Runs an action: a toast either way, then the screen refreshes. Returns ok. */
function useRun() {
  const { t } = useLocale();
  const router = useRouter();
  return async (action: () => Promise<PlaceResult>, success: MessageKey) => {
    const result = await action();
    if (!result.ok) {
      const field = Object.values(result.fields ?? {})[0];
      toast.add({ title: t(field ?? result.error), type: "error" });
      return false;
    }
    toast.add({ title: t(success) });
    router.refresh();
    return true;
  };
}

/** Approve a request for a new place, or turn it down with a reason. */
export function AnswerPlaceRequest({ id, name }: { id: string; name: string }) {
  const { t } = useLocale();
  const run = useRun();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        size="xl"
        className="flex-1 rounded-xl"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await run(() => resolvePlaceRequest(id, true), "Place added");
          })
        }
      >
        {pending && <Spinner />}
        {t("Approve")}
      </Button>
      <Button
        size="xl"
        variant="outline"
        className="flex-1 rounded-xl"
        disabled={pending}
        onClick={() => setRejecting(true)}
      >
        {t("Reject")}
      </Button>
      <ReasonSheet
        open={rejecting}
        onOpenChange={setRejecting}
        title={t("Reject {{name}}?", { name })}
        description={t("They'll see your reason.")}
        label={t("Reason")}
        confirmLabel={t("Reject")}
        destructive
        required
        onConfirm={(reason) =>
          run(() => resolvePlaceRequest(id, false, reason), "Request rejected")
        }
      />
    </div>
  );
}

/** Take back your own waiting request. */
export function CancelPlaceRequest({ id }: { id: string }) {
  const { t } = useLocale();
  const run = useRun();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="xl"
        variant="outline"
        className="w-full rounded-xl"
        onClick={() => setOpen(true)}
      >
        {t("Cancel request")}
      </Button>
      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title={t("Cancel this request?")}
        confirmLabel={t("Cancel request")}
        destructive
        onConfirm={async () => {
          await run(() => cancelPlaceRequest(id), "Request cancelled");
        }}
      />
    </>
  );
}

/** A place admin asking the super admin to add someone as a co-admin. */
export function AskCoAdmin({ place }: { place: string }) {
  const { t } = useLocale();
  const run = useRun();
  const [username, setUsername] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur();
        startTransition(async () => {
          const ok = await run(
            () => requestAdminChange(place, "add", username, note),
            "Request sent",
          );
          if (ok) {
            setUsername("");
            setNote("");
          }
        });
      }}
    >
      <Field>
        <FieldLabel htmlFor="co-admin">{t("Their @username")}</FieldLabel>
        <Input
          id="co-admin"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          dir="ltr"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="send"
          maxLength={51}
          className={INPUT}
        />
      </Field>
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        aria-label={t("Note for the admin (optional)")}
        placeholder={t("Note for the admin (optional)")}
        maxLength={500}
        dir="auto"
        className="min-h-20 resize-none rounded-xl px-3 text-base md:text-base"
      />
      <Button
        type="submit"
        size="xl"
        className="rounded-xl"
        disabled={pending || !username.trim()}
      >
        {pending && <Spinner />}
        {t("Ask to add as admin")}
      </Button>
    </form>
  );
}

/** A place admin asking the super admin to remove one of its admins. */
export function AskRemoveAdmin({
  place,
  username,
  name,
}: {
  place: string;
  username: string;
  name: string;
}) {
  const { t } = useLocale();
  const run = useRun();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="xl"
        variant="ghost"
        className="rounded-xl text-destructive"
        onClick={() => setOpen(true)}
      >
        {t("Ask to remove")}
      </Button>
      <ReasonSheet
        open={open}
        onOpenChange={setOpen}
        title={t("Ask to remove {{name}}?", { name })}
        description={t("The Qura team decides.")}
        label={t("Reason")}
        confirmLabel={t("Send request")}
        destructive
        onConfirm={(reason) =>
          run(
            () => requestAdminChange(place, "remove", username, reason),
            "Request sent",
          )
        }
      />
    </>
  );
}
