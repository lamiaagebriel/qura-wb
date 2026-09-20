"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, ButtonProps } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { ImageUploadField, type ImageSlot } from "@/components/image-upload-field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { ThreadCategory } from "@/db/schema";
import { createThreadAction } from "@/lib/threads/actions/create";
import { updateThreadAction } from "@/lib/threads/actions/update";
import {
  getThreadImagePathAction,
  reserveThreadIdAction,
} from "@/lib/threads/actions/image-path";
import { discardThreadImagesAction } from "@/lib/storage/actions";
import { clearDraft, readDraft, writeDraft } from "@/lib/threads/draft-store";
import {
  deletePendingImage,
  getPendingImage,
} from "@/lib/threads/pending-image-store";
import { resolvePendingSlots } from "@/lib/threads/resolve-pending-slots";
import {
  addOptimisticPost,
  removeOptimisticPost,
  updateOptimisticPost,
} from "@/lib/threads/optimistic-posts";
import {
  THREAD_CATEGORY_META,
  THREAD_CATEGORY_ORDER,
} from "@/lib/threads/categories";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import {
  createThreadSchema,
  type ThreadValues,
} from "@/lib/validations/thread";
import { createZodResolver } from "@/lib/validations/resolver";
import { useAuthPrompt } from "./auth-prompt";
import { cn } from "@/lib/utils";

let nextTempId = 0;
function localTempId(): string {
  nextTempId += 1;
  return `optimistic-${Date.now()}-${nextTempId}`;
}

type ComposerUser = { name: string; username: string; image?: string | null };
// A business you own — same shape as `ComposerUser` plus the `id`
// actually needed to post "as" it (`ComposerUser` never needed one: the
// only identity it ever represented was "you", implicit in the session).
export type ComposerBusiness = {
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

// Deletes the IndexedDB blob (and revokes the in-memory preview URL) for
// every `pending` slot in the list — the local-only counterpart to
// `discardThreadImagesAction` for images that were never actually
// uploaded. Safe to call on a mixed list (edit mode's `uploaded` slots
// are silently skipped, since there's nothing local to clean up for
// those).
function discardPendingSlots(slots: ImageSlot[]) {
  for (const slot of slots) {
    if (slot.kind !== "pending") continue;
    URL.revokeObjectURL(slot.previewUrl);
    void deletePendingImage(slot.id);
  }
}

/**
 * The full-screen modal itself — slides up from the bottom (not the
 * usual partial-height `Sheet`), plus the discard confirmation you get
 * backing out with unsaved changes. Creating gets a save-as-draft option
 * (one slot in `localStorage`, not a real per-user drafts table);
 * editing doesn't — there's nothing to "draft", the thread already
 * exists, so backing out with changes only offers discard-or-keep-editing.
 *
 * Images are staged, never uploaded, until Post/Save (see
 * `image-upload-field.tsx` and `resolvePendingSlots` above) — creating a
 * thread closes this sheet immediately and shows the post in the feed
 * right away via `optimistic-posts.ts`, uploading in the background;
 * editing resolves pending images synchronously before calling
 * `updateThreadAction`, since there's no "already looks posted" illusion
 * to maintain there.
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
  // The identity switcher lives right on the avatar now (tap it to open
  // this) rather than a separate labeled picker above the body — same
  // bottom-sheet pattern `ProfileSwitcher` already uses for the same
  // "you or one of your businesses" choice elsewhere in the app.
  const [postAsSheetOpen, setPostAsSheetOpen] = useState(false);
  const schema = useMemo(() => createThreadSchema(t), [t]);
  // Every image, uploaded already (edit mode's pre-existing ones) or
  // still staged locally — managed as plain state, not through
  // react-hook-form/zod, since "is this a valid URL" (what the schema's
  // `images` field validates) is meaningless for a `pending` slot that
  // hasn't been uploaded yet. The final, resolved `string[]` is only
  // ever produced right before actually calling the server action (see
  // `resolvePendingSlots`).
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() =>
    isEdit ? request.images.map((url): ImageSlot => ({ kind: "uploaded", url })) : [],
  );
  const [isPublishing, setIsPublishing] = useState(false);

  // Reopening a draft: its body/category come in synchronously below
  // (plain localStorage), but its staged images live in IndexedDB, which
  // is async — so they arrive a moment later here instead of being part
  // of `imageSlots`'s initial value.
  useEffect(() => {
    if (isEdit) return;
    let cancelled = false;
    (async () => {
      const draft = readDraft();
      if (!draft || draft.pendingImageIds.length === 0) return;
      const loaded: ImageSlot[] = [];
      for (const id of draft.pendingImageIds) {
        const blob = await getPendingImage(id);
        // A blob IndexedDB no longer has (cleared site data, a very old
        // draft) just quietly drops that one image rather than blocking
        // the rest of the draft from reopening.
        if (blob) {
          loaded.push({ kind: "pending", id, previewUrl: URL.createObjectURL(blob) });
        }
      }
      if (!cancelled && loaded.length > 0) setImageSlots(loaded);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount, reading the draft that existed when the sheet opened; it isn't meant to re-run as `isEdit` can't change for a mounted sheet.
  }, []);

  const form = useForm<Pick<ThreadValues, "body" | "category">>({
    resolver: createZodResolver(schema.pick({ body: true, category: true })),
    defaultValues: isEdit
      ? { body: request.body }
      : (() => {
          const draft = readDraft();
          return {
            body: draft?.body ?? "",
            category: draft?.category ?? "general",
          };
        })(),
  });
  // Drives the submit button's disabled state and the character counter
  // below the textarea — a live subscription (not read once) so both
  // update as you type instead of only after a submit attempt fails.
  const bodyValue = form.watch("body");

  function reallyClose() {
    setConfirmDiscard(false);
    setOpen(false);
    // Let the sheet's own close animation play instead of yanking it out
    // of the tree (and losing the provider's `request`) mid-slide.
    setTimeout(onClose, 200);
  }

  function requestClose() {
    const { body } = form.getValues();

    if (isEdit) {
      const changed =
        body !== request.body ||
        imageSlots.length !== request.images.length ||
        imageSlots.some(
          (slot, i) => slot.kind !== "uploaded" || slot.url !== request.images[i],
        );
      if (!changed) {
        reallyClose();
        return;
      }
      setConfirmDiscard(true);
      return;
    }

    if (!body.trim() && imageSlots.length === 0) {
      clearDraft();
      reallyClose();
      return;
    }
    setConfirmDiscard(true);
  }

  function saveDraft() {
    const { body, category } = form.getValues();
    const pendingImageIds = imageSlots
      .filter((slot): slot is Extract<ImageSlot, { kind: "pending" }> => slot.kind === "pending")
      .map((slot) => slot.id);
    writeDraft({ body, category, pendingImageIds });
    toast.success(t("Draft saved."));
    reallyClose();
  }

  function discardDraft() {
    // Nothing was ever uploaded to S3 for a create-mode draft — only
    // the local IndexedDB staging needs cleaning up.
    discardPendingSlots(imageSlots);
    clearDraft();
    toast.success(t("Thread discarded."));
    reallyClose();
  }

  function discardEdit() {
    // Only the pending (newly added, never-saved) slots are ours to
    // clean up here — the `uploaded` ones belong to the still-live
    // thread regardless of how this edit ends.
    discardPendingSlots(imageSlots);
    reallyClose();
  }

  async function onSubmitEdit(values: { body: string; category: string }) {
    if (request.mode !== "edit") return;

    // The thread already has a reserved path — reused here so a newly
    // added image lands exactly where a future subtree delete would
    // look for it.
    const imagePath = await getThreadImagePathAction(request.threadId);
    if (!imagePath) {
      toast.error(t("Something went wrong. Please try again."));
      return;
    }

    const resolved = await resolvePendingSlots(imageSlots, imagePath);
    if (!resolved.ok) {
      if (resolved.uploadedUrls.length > 0) {
        void discardThreadImagesAction(resolved.uploadedUrls);
      }
      toast.error(t("Couldn't upload one of your images. Please try again."));
      return;
    }

    const result = await updateThreadAction(request.threadId, {
      body: values.body,
      images: resolved.urls,
    });
    if (!result.success) {
      // Anything freshly uploaded for this attempt has to go too — the
      // update itself never happened, so nothing references them.
      const newlyUploaded = resolved.urls.filter(
        (url) => !request.images.includes(url),
      );
      if (newlyUploaded.length > 0) void discardThreadImagesAction(newlyUploaded);
      handleAppError(result.error, form);
      return;
    }

    toast.success(t("Thread updated."));
    request.onSaved?.({ body: values.body, images: resolved.urls });
    reallyClose();
    router.refresh();
  }

  // Create mode: closes the sheet immediately and shows the thread as
  // posted right away (an `OptimisticPost`, see `optimistic-posts.ts`),
  // uploading in the background — never awaited by the form submit
  // itself, so nothing here depends on this component staying mounted
  // (it won't be, a moment after this runs).
  function publishInBackground(
    tempId: string,
    body: string,
    category: ThreadCategory,
    asBusinessId: string | undefined,
    slots: ImageSlot[],
  ) {
    const pendingImageIds = slots
      .filter((slot): slot is Extract<ImageSlot, { kind: "pending" }> => slot.kind === "pending")
      .map((slot) => slot.id);

    void (async () => {
      // Reserved here, not at sheet-open time — this thread doesn't
      // need a real id (or its images a real S3 destination) until it's
      // actually about to publish; the optimistic card already renders
      // straight from the local blob previews until then.
      const reserved = await reserveThreadIdAction();
      if (!reserved) {
        updateOptimisticPost(tempId, { failed: true });
        return;
      }

      const resolved = await resolvePendingSlots(slots, reserved.imagePath);
      if (!resolved.ok) {
        if (resolved.uploadedUrls.length > 0) {
          void discardThreadImagesAction(resolved.uploadedUrls);
        }
        updateOptimisticPost(tempId, { failed: true });
        return;
      }

      const result = await createThreadAction(
        {
          body,
          images: resolved.urls,
          category,
          asBusinessId,
        },
        reserved,
      );
      if (!result.success) {
        if (resolved.urls.length > 0) void discardThreadImagesAction(resolved.urls);
        updateOptimisticPost(tempId, { failed: true });
        return;
      }

      // Only now — confirmed published — is the draft/local staging
      // actually done with. A failure above leaves all of it untouched,
      // which is what makes "Keep as draft" on the optimistic card just
      // work with no extra recovery logic.
      clearDraft();
      for (const id of pendingImageIds) void deletePendingImage(id);
      removeOptimisticPost(tempId);
      router.refresh();
    })();
  }

  async function onSubmitCreate(values: { body: string; category: string }) {
    if (request.mode !== "create" || isPublishing) return;
    setIsPublishing(true);

    const category = (values.category || "general") as ThreadCategory;
    const asBusinessId = postAsId === "self" ? undefined : postAsId;
    const tempId = localTempId();

    addOptimisticPost({
      tempId,
      identity: {
        name: activeIdentity.name,
        username: activeIdentity.username,
        image: activeIdentity.image ?? null,
      },
      body: values.body,
      category,
      previewUrls: imageSlots.map((slot) =>
        slot.kind === "uploaded" ? slot.url : slot.previewUrl,
      ),
      pendingImageIds: imageSlots
        .filter((slot): slot is Extract<ImageSlot, { kind: "pending" }> => slot.kind === "pending")
        .map((slot) => slot.id),
      failed: false,
    });

    reallyClose();
    publishInBackground(tempId, values.body, category, asBusinessId, imageSlots);
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
  // Narrowed out here (not just inline `request.mode === "create"`
  // checks) so the JSX below can use `businesses` without TypeScript
  // losing the narrowing the moment it's read through a separately
  // computed boolean like `canSwitchIdentity`.
  const businesses = request.mode === "create" ? request.businesses : [];
  // Only create mode with at least one business has anything to switch
  // to — editing never renders the picker (a thread's author isn't
  // something editing changes, same as the old `Select`'s condition).
  const canSwitchIdentity = businesses.length > 0;

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
            onSubmit={form.handleSubmit(isEdit ? onSubmitEdit : onSubmitCreate)}
            noValidate
            className="flex h-full flex-col"
          >
            <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("Cancel")}
                onClick={requestClose}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
              </Button>
              <span className="text-foreground text-[14.5px] font-semibold">
                {title}
              </span>
              <Button
                type="submit"
                size="sm"
                className="rounded-full px-4"
                disabled={
                  form.formState.isSubmitting || isPublishing || !bodyValue.trim()
                }
              >
                {isEdit ? t("Save") : t("Post")}
              </Button>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              {/* A one-tap chip row instead of a dropdown — only ever set
                  at creation (see `ThreadValues.category`'s own comment),
                  so this never renders in edit mode. Picking a category
                  is a quick, low-stakes choice made once up front, not
                  worth the extra tap-to-open/tap-to-pick a `Select`
                  needs; a chip row shows every option at a glance and
                  picks in one tap, the same pattern `FeedThreadList`'s
                  filter chips already use for the identical data. */}
              {!isEdit && (
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
                        {THREAD_CATEGORY_ORDER.map((option) => {
                          const meta = THREAD_CATEGORY_META[option];
                          const active = field.value === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => field.onChange(option)}
                              aria-pressed={active}
                              className={cn(
                                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium whitespace-nowrap",
                                active
                                  ? meta.color.chipActive
                                  : meta.color.chipInactive,
                              )}
                            >
                              <HugeiconsIcon
                                icon={meta.icon}
                                className="size-3.5"
                              />
                              {t(meta.label)}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  )}
                />
              )}

              <div className="flex flex-col gap-3">
                {/* The avatar itself is the "post as" picker now — no
                    separate labeled field above the body. Only actually
                    switchable when there's something to switch to
                    (create mode with at least one business); otherwise
                    it's just a plain avatar, same as edit mode always
                    was. */}

                {canSwitchIdentity ? (
                  <button
                    type="button"
                    onClick={() => setPostAsSheetOpen(true)}
                    className="relative flex shrink-0 gap-2"
                    aria-label={t("Post as")}
                  >
                    <Avatar>
                      {activeIdentity.image && (
                        <AvatarImage
                          src={activeIdentity.image}
                          alt={activeIdentity.name}
                        />
                      )}
                      <AvatarFallback>{activeIdentity.name}</AvatarFallback>
                    </Avatar>

                    <div className="text-foreground flex items-center gap-1 text-[13.5px] font-semibold">
                      {activeIdentity.username}
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className="text-muted-foreground size-3"
                      />
                    </div>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <Avatar>
                      {activeIdentity.image && (
                        <AvatarImage
                          src={activeIdentity.image}
                          alt={activeIdentity.name}
                        />
                      )}
                      <AvatarFallback>{activeIdentity.name}</AvatarFallback>
                    </Avatar>
                    <p className="text-foreground text-[13.5px] font-semibold">
                      {activeIdentity.username}
                    </p>
                  </div>
                )}
                <div className="flex-1">
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
                          {/* A quiet running count rather than only an
                              error once you've already gone over —
                              lets you see the limit coming instead of
                              hitting a wall at the 500th character. */}
                          <span
                            className={cn(
                              "self-end text-[11px] tabular-nums",
                              bodyValue.length > 450
                                ? "text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            {bodyValue.length}/500
                          </span>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Field>
                      <ImageUploadField
                        slots={imageSlots}
                        onChange={setImageSlots}
                        disabled={form.formState.isSubmitting || isPublishing}
                      />
                    </Field>
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
              onClick={isEdit ? discardEdit : discardDraft}
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

      {canSwitchIdentity && (
        <Sheet open={postAsSheetOpen} onOpenChange={setPostAsSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>{t("Post as")}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col px-4 pb-6">
              {[{ id: "self", ...user }, ...businesses].map((identity) => (
                <button
                  key={identity.id}
                  type="button"
                  onClick={() => {
                    setPostAsId(identity.id);
                    setPostAsSheetOpen(false);
                  }}
                  className="border-border/60 flex items-center gap-3 border-b py-3 last:border-b-0"
                >
                  <Avatar>
                    {identity.image && (
                      <AvatarImage src={identity.image} alt={identity.name} />
                    )}
                    <AvatarFallback>{identity.name}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col text-start leading-tight">
                    <span className="text-foreground text-[13.5px] font-medium">
                      {identity.id === "self" ? t("You") : identity.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      @{identity.username}
                    </span>
                  </div>
                  {postAsId === identity.id && (
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      className="text-primary size-4 shrink-0"
                    />
                  )}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      )}
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
