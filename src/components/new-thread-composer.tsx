"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, ButtonProps } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createThreadAction } from "@/lib/threads/actions/create";
import { updateThreadAction } from "@/lib/threads/actions/update";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import {
  createThreadSchema,
  type ThreadValues,
} from "@/lib/validations/thread";
import { createZodResolver } from "@/lib/validations/resolver";
import { useAuthPrompt } from "./auth-prompt";
import { cn } from "@/lib/utils";

const DRAFT_STORAGE_KEY = "qura:new-thread-draft";

type Draft = { body: string; images: string[] };

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.body === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: Draft) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

type ComposerUser = { name: string; username: string; image?: string | null };
// A business you own — same shape as `ComposerUser` plus the `id`
// actually needed to post "as" it (`ComposerUser` never needed one: the
// only identity it ever represented was "you", implicit in the session).
type ComposerBusiness = {
  id: string;
  name: string;
  username: string;
  image?: string | null;
};

type ComposerRequest =
  | {
      mode: "create";
      user: ComposerUser;
      businesses: ComposerBusiness[];
      defaultPostAsId?: string;
    }
  | {
      mode: "edit";
      user: ComposerUser;
      threadId: string;
      body: string;
      images: string[];
      onSaved?: (values: { body: string; images: string[] }) => void;
    };

type ThreadComposerContextValue = {
  /** Opens the full-screen composer for a brand-new top-level thread.
   * `businesses` populates the "Post as" picker — empty for someone who
   * hasn't created one, in which case the picker doesn't render at all.
   * `defaultPostAsId` preselects one of them (the currently "active"
   * identity from the profile switcher) instead of always starting on
   * "You". */
  openCreate: (
    user: ComposerUser,
    businesses: ComposerBusiness[],
    defaultPostAsId?: string,
  ) => void;
  /** Opens the *same* composer pre-filled for editing an existing thread
   * — this is the merge point: creating and editing are one sheet, one
   * form, just a different submit action and a different "did you mean
   * to lose this?" prompt on the way out. `onSaved` lets the calling
   * `ThreadCard` update its own local body/images the instant the save
   * succeeds, instead of waiting on `router.refresh()` to re-fetch. Never
   * offers a "post as" picker — a thread's author, business or not,
   * isn't something editing changes. */
  openEdit: (request: {
    threadId: string;
    body: string;
    images: string[];
    user: ComposerUser;
    onSaved?: (values: { body: string; images: string[] }) => void;
  }) => void;
};

const ThreadComposerContext = createContext<ThreadComposerContextValue | null>(
  null,
);

export function useThreadComposer(): ThreadComposerContextValue {
  const ctx = useContext(ThreadComposerContext);
  if (!ctx) {
    throw new Error(
      "useThreadComposer must be used inside <ThreadComposerProvider>",
    );
  }
  return ctx;
}

/** Mounted once at the root (`app/layout.tsx`), same pattern as
 * `AuthPromptProvider` — so both the "+" in `BottomNav` and the "Edit"
 * row in a `ThreadCard`'s options drawer can open the exact same
 * full-screen sheet instead of each owning their own copy. */
export function ThreadComposerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [request, setRequest] = useState<ComposerRequest | null>(null);

  return (
    <ThreadComposerContext.Provider
      value={{
        openCreate: (user, businesses, defaultPostAsId) =>
          setRequest({ mode: "create", user, businesses, defaultPostAsId }),
        openEdit: (args) => setRequest({ mode: "edit", ...args }),
      }}
    >
      {children}
      {request && (
        <ComposerSheet request={request} onClose={() => setRequest(null)} />
      )}
    </ThreadComposerContext.Provider>
  );
}

/**
 * The full-screen modal itself — slides up from the bottom (not the
 * usual partial-height `Sheet`), plus the discard confirmation you get
 * backing out with unsaved changes. Creating gets a save-as-draft option
 * (one slot in `localStorage`, not a real per-user drafts table);
 * editing doesn't — there's nothing to "draft", the thread already
 * exists, so backing out with changes only offers discard-or-keep-editing.
 */
function ComposerSheet({
  request,
  onClose,
}: {
  request: ComposerRequest;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const isEdit = request.mode === "edit";
  const [open, setOpen] = useState(true);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // "self" (post as your own account) or a business id from
  // `request.businesses` — only ever meaningful in create mode, but kept
  // as plain state (not gated behind `isEdit`) since hooks can't be
  // conditional. Starts on whichever identity was active when the "+"
  // was tapped (see `defaultPostAsId`), not always "You" — the whole
  // point of switching is that posting defaults to it from then on.
  const [postAsId, setPostAsId] = useState(() =>
    request.mode === "create" ? (request.defaultPostAsId ?? "self") : "self",
  );
  const schema = useMemo(() => createThreadSchema(t), [t]);

  const form = useForm<ThreadValues>({
    resolver: createZodResolver(schema),
    defaultValues: isEdit
      ? { body: request.body, images: request.images }
      : (() => {
          const draft = readDraft();
          return { body: draft?.body ?? "", images: draft?.images ?? [] };
        })(),
  });

  function reallyClose() {
    setConfirmDiscard(false);
    setOpen(false);
    // Let the sheet's own close animation play instead of yanking it out
    // of the tree (and losing the provider's `request`) mid-slide.
    setTimeout(onClose, 200);
  }

  function requestClose() {
    const { body, images } = form.getValues();

    if (isEdit) {
      const changed =
        body !== request.body ||
        images.length !== request.images.length ||
        images.some((url, i) => url !== request.images[i]);
      if (!changed) {
        reallyClose();
        return;
      }
      setConfirmDiscard(true);
      return;
    }

    if (!body.trim() && images.every((url) => !url.trim())) {
      clearDraft();
      reallyClose();
      return;
    }
    setConfirmDiscard(true);
  }

  function saveDraft() {
    const { body, images } = form.getValues();
    writeDraft({ body, images });
    toast.success(t("Draft saved."));
    reallyClose();
  }

  function discardDraft() {
    clearDraft();
    toast.success(t("Thread discarded."));
    reallyClose();
  }

  async function onSubmit(values: ThreadValues) {
    const result = isEdit
      ? await updateThreadAction(request.threadId, values)
      : await createThreadAction({
          ...values,
          asBusinessId: postAsId === "self" ? undefined : postAsId,
        });
    if (!result.success) {
      handleAppError(result.error, form);
      return;
    }
    if (!isEdit) {
      clearDraft();
    } else {
      toast.success(t("Thread updated."));
      request.onSaved?.({ body: values.body, images: values.images });
    }
    reallyClose();
    router.refresh();
  }

  const { user } = request;
  const title = isEdit ? t("Edit thread") : t("New thread");
  // The identity actually shown/posted as — your own account unless a
  // business is picked below. `postAsId` can only ever name one of
  // `request.businesses` in create mode (edit mode never renders the
  // picker that sets it), so the fallback to `user` is purely defensive.
  const activeIdentity =
    request.mode === "create" && postAsId !== "self"
      ? (request.businesses.find((b) => b.id === postAsId) ?? user)
      : user;

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            requestClose();
            return;
          }
          setOpen(next);
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="data-[side=bottom]:top-0 data-[side=bottom]:h-dvh data-[side=bottom]:rounded-none data-[side=bottom]:border-t-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="flex h-full flex-col"
          >
            <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={requestClose}
              >
                {t("Cancel")}
              </Button>
              <span className="text-foreground text-[14.5px] font-semibold">
                {title}
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={form.formState.isSubmitting}
              >
                {isEdit ? t("Save") : t("Post")}
              </Button>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              {request.mode === "create" && request.businesses.length > 0 && (
                <Field>
                  <Select value={postAsId} onValueChange={setPostAsId}>
                    <SelectTrigger size="sm" className="w-fit">
                      <span className="text-muted-foreground text-xs">
                        {t("Post as")}
                      </span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="self">{t("You")}</SelectItem>
                      {request.businesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              <div className="flex gap-3">
                <Avatar>
                  {activeIdentity.image && (
                    <AvatarImage
                      src={activeIdentity.image}
                      alt={activeIdentity.name}
                    />
                  )}
                  <AvatarFallback>{activeIdentity.name}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-foreground text-[13.5px] font-semibold">
                    {activeIdentity.username}
                  </p>
                  <FieldGroup className="mt-1">
                    <Controller
                      name="body"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <Textarea
                            {...field}
                            rows={4}
                            maxLength={500}
                            autoFocus
                            placeholder={t("What's new?")}
                            className="border-0 bg-transparent px-0 py-0 focus-visible:ring-0"
                            aria-invalid={fieldState.invalid}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Controller
                      name="images"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <>
                          {field.value.map((url, index) => (
                            <Field key={index}>
                              <div className="flex items-center gap-1.5">
                                <Textarea
                                  rows={1}
                                  value={url}
                                  onChange={(e) => {
                                    const next = [...field.value];
                                    next[index] = e.target.value;
                                    field.onChange(next);
                                  }}
                                  placeholder={t("Image URL (optional)")}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={t("Remove this image")}
                                  onClick={() =>
                                    field.onChange(
                                      field.value.filter((_, i) => i !== index),
                                    )
                                  }
                                >
                                  <HugeiconsIcon
                                    icon={Delete02Icon}
                                    className="size-4"
                                  />
                                </Button>
                              </div>
                            </Field>
                          ))}
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                          {field.value.length < 4 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="w-fit"
                              onClick={() =>
                                field.onChange([...field.value, ""])
                              }
                            >
                              {field.value.length === 0
                                ? t("Add image")
                                : t("Add another image")}
                            </Button>
                          )}
                        </>
                      )}
                    />
                  </FieldGroup>
                </div>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>
              {isEdit ? t("Discard changes?") : t("Discard thread?")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4 pb-6">
            {!isEdit && (
              <Button type="button" variant="outline" onClick={saveDraft}>
                {t("Save draft")}
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              onClick={isEdit ? reallyClose : discardDraft}
            >
              {t("Discard")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmDiscard(false)}
            >
              {t("Keep editing")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** The "+" entry point in `BottomNav` — the only thing that still lives
 * there is the trigger button; the sheet itself is the shared one from
 * `ThreadComposerProvider`. */
export function NewThreadButton({
  user,
  businesses = [],
  defaultPostAsId,
  className,
  ...props
}: {
  user?: { username: string; name: string; image?: string | null } | null;
  businesses?: ComposerBusiness[];
  defaultPostAsId?: string;
} & ButtonProps) {
  const { t } = useLocale();
  const { promptSignIn } = useAuthPrompt();
  const { openCreate } = useThreadComposer();

  function handleClick() {
    if (!user?.username) {
      promptSignIn();
      return;
    }
    openCreate(user, businesses, defaultPostAsId);
  }

  return (
    <Button
      type="button"
      aria-label={t("New thread")}
      onClick={handleClick}
      size="icon-lg"
      className={cn("cursor-pointer rounded-full", className)}
      {...props}
    >
      <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} className="size-4" />
    </Button>
  );
}
