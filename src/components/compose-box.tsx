"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  ImageAdd01Icon,
  SentIcon,
  User,
} from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldError } from "@/components/ui/field";
import {
  ImageUploadField,
  type ImageSlot,
  type ImageUploadFieldHandle,
} from "@/components/image-upload-field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { createThreadAction } from "@/lib/threads/actions/create";
import { updateThreadAction } from "@/lib/threads/actions/update";
import {
  getThreadImagePathAction,
  reserveThreadIdAction,
} from "@/lib/threads/actions/image-path";
import { discardThreadImagesAction } from "@/lib/storage/actions";
import { resolvePendingSlots } from "@/lib/threads/resolve-pending-slots";
import { deletePendingImage } from "@/lib/threads/pending-image-store";
import {
  addOptimisticPost,
  updateOptimisticPost,
  removeOptimisticPost,
} from "@/lib/threads/optimistic-posts";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import {
  createThreadSchema,
  type ThreadValues,
} from "@/lib/validations/thread";
import { createZodResolver } from "@/lib/validations/resolver";
import { useAuthPrompt } from "./auth-prompt";

let nextTempId = 0;
function localTempId(): string {
  nextTempId += 1;
  return `optimistic-reply-${Date.now()}-${nextTempId}`;
}

/** Set when this box is editing an existing reply in place — `ThreadCard`
 * swaps its normal display for a `ComposeBox` in this mode instead of
 * opening the full-screen composer sheet, so editing a reply reads as
 * "the same box you replied with, now pre-filled" rather than a whole
 * different "Edit thread" flow. Image CRUD is unchanged from the
 * full-screen editor: pending slots resolve to real URLs at Save time,
 * and `updateThreadAction` itself diffs against the reply's existing
 * `images` and deletes from S3 whatever got dropped. */
export type ComposeBoxEditing = {
  threadId: string;
  initialBody: string;
  initialImages: string[];
  onSaved: (values: { body: string; images: string[] }) => void;
  onCancel: () => void;
};

/**
 * The inline reply box (`/thread/[id]`) — same deferred-upload/
 * background-publish model as the full-screen composer
 * (`new-thread-composer.tsx`): images are staged locally (never
 * uploaded on select) and the actual S3 upload + `createThreadAction`
 * call happen after this box has already reset itself, driven through
 * the shared `optimistic-posts.ts` store so `ThreadReplies` can show the
 * reply as posted immediately with its own "Uploading…" indicator (see
 * `ThreadCard`'s `uploading` prop) instead of the two of them
 * duplicating that logic.
 *
 * The image icon opens the device's file picker directly on tap
 * (`imageFieldRef.current?.openPicker()`) — no intermediate "reveal an
 * Add Photos button" step; the preview area (mirroring how the images
 * will actually look once posted) only shows up once something's
 * actually been picked.
 *
 * `editing` (see `ComposeBoxEditing` above) switches this same box into
 * editing an existing reply instead of posting a new one — a real,
 * awaited `updateThreadAction` call rather than the optimistic
 * background-publish path, since there's no "already looks posted"
 * illusion to maintain for something that's already live (same
 * reasoning `new-thread-composer.tsx`'s own edit mode uses).
 */
export function ComposeBox({
  user,
  parentId,
  placeholder,
  onPosted,
  editing,
}: {
  user:
    | {
        id: string;
        name: string;
        username: string;
        image?: string | null | undefined;
      }
    | null
    | undefined;
  parentId?: string;
  placeholder?: string;
  onPosted?: () => void;
  editing?: ComposeBoxEditing;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const { promptSignIn } = useAuthPrompt();
  // Staged locally, not uploaded, until Post/Save — same deferred-upload
  // staging `new-thread-composer.tsx` uses (see `image-upload-field.tsx`
  // and `resolvePendingSlots`). A pending image never posted just sits
  // in IndexedDB until the tab closes or it's manually removed here —
  // nothing was ever uploaded to S3 for it to orphan there in the
  // meantime. Editing seeds this from the reply's existing images, as
  // already-`uploaded` slots — removing one here is exactly what tells
  // `updateThreadAction` to delete it from S3 on Save.
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() =>
    editing
      ? editing.initialImages.map((url): ImageSlot => ({ kind: "uploaded", url }))
      : [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const imageFieldRef = useRef<ImageUploadFieldHandle>(null);
  const schema = useMemo(() => createThreadSchema(t), [t]);

  const form = useForm<Pick<ThreadValues, "body">>({
    resolver: createZodResolver(schema.pick({ body: true })),
    defaultValues: { body: editing?.initialBody ?? "" },
  });

  // Never awaited by the submit handler itself — the box has already
  // reset and the optimistic reply is already showing by the time this
  // runs, so nothing here depends on this component staying mounted.
  function publishInBackground(
    tempId: string,
    body: string,
    slots: ImageSlot[],
  ) {
    const pendingImageIds = slots
      .filter(
        (slot): slot is Extract<ImageSlot, { kind: "pending" }> =>
          slot.kind === "pending",
      )
      .map((slot) => slot.id);

    void (async () => {
      // Reserved here, not earlier — this thread doesn't need a real id
      // (and its images don't need a real S3 destination) until it's
      // actually about to publish; the optimistic card above already
      // renders straight from the local blob previews in the meantime.
      const reserved = await reserveThreadIdAction(parentId);
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
          category: "general",
          parentId,
        },
        reserved,
      );
      if (!result.success) {
        if (resolved.urls.length > 0)
          void discardThreadImagesAction(resolved.urls);
        updateOptimisticPost(tempId, { failed: true });
        return;
      }

      for (const id of pendingImageIds) void deletePendingImage(id);
      removeOptimisticPost(tempId);
      router.refresh();
    })();
  }

  // Awaited, unlike a new reply's `publishInBackground` — this reply
  // already exists and is already visible everywhere; there's no
  // optimistic placeholder to stand in for it while this runs, just a
  // disabled Save button. `updateThreadAction` itself handles the S3
  // diff (deletes whatever got dropped from `images`); only a NEWLY
  // uploaded image from THIS failed attempt is this function's own to
  // clean up, same as `new-thread-composer.tsx`'s edit mode.
  async function saveEdit(values: { body: string }) {
    if (!editing) return;
    setIsSaving(true);

    // The reply already has a reserved path — reused here (never
    // re-derived by walking its parent chain) so a newly added image
    // lands exactly where a future subtree delete would look for it.
    const imagePath = await getThreadImagePathAction(editing.threadId);
    if (!imagePath) {
      setIsSaving(false);
      handleAppError({
        kind: "message",
        message: t("Something went wrong. Please try again."),
      });
      return;
    }

    const resolved = await resolvePendingSlots(imageSlots, imagePath);
    if (!resolved.ok) {
      if (resolved.uploadedUrls.length > 0) {
        void discardThreadImagesAction(resolved.uploadedUrls);
      }
      setIsSaving(false);
      handleAppError({
        kind: "message",
        message: t("Couldn't upload one of your images. Please try again."),
      });
      return;
    }

    const result = await updateThreadAction(editing.threadId, {
      body: values.body,
      images: resolved.urls,
    });
    if (!result.success) {
      const newlyUploaded = resolved.urls.filter(
        (url) => !editing.initialImages.includes(url),
      );
      if (newlyUploaded.length > 0) void discardThreadImagesAction(newlyUploaded);
      setIsSaving(false);
      handleAppError(result.error, form);
      return;
    }

    editing.onSaved({ body: values.body, images: resolved.urls });
  }

  function onSubmit(values: { body: string }) {
    if (editing) {
      void saveEdit(values);
      return;
    }

    if (!user?.id) {
      promptSignIn();
      return;
    }

    const tempId = localTempId();
    addOptimisticPost({
      tempId,
      identity: {
        name: user.name,
        username: user.username,
        image: user.image ?? null,
      },
      body: values.body,
      category: "general",
      parentId,
      previewUrls: imageSlots.map((slot) =>
        slot.kind === "uploaded" ? slot.url : slot.previewUrl,
      ),
      pendingImageIds: imageSlots
        .filter(
          (slot): slot is Extract<ImageSlot, { kind: "pending" }> =>
            slot.kind === "pending",
        )
        .map((slot) => slot.id),
      failed: false,
    });
    // The reply already "exists" from the user's point of view the
    // instant the optimistic card is up — this is what actually bumps
    // the parent thread's reply count right away, not the background
    // publish's eventual success.
    onPosted?.();

    const slots = imageSlots;
    form.reset({ body: "" });
    setImageSlots([]);
    publishInBackground(tempId, values.body, slots);
  }

  // Only newly-picked slots are this box's to clean up — they were never
  // uploaded (deferred staging), just sitting in IndexedDB, so this is
  // local-only, no S3 involved. The reply's pre-existing images are
  // untouched either way, exactly as if this edit never happened.
  function cancelEdit() {
    for (const slot of imageSlots) {
      if (slot.kind === "pending") void deletePendingImage(slot.id);
    }
    editing?.onCancel();
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="flex gap-2"
    >
      <Avatar>
        {user?.image && <AvatarImage src={user.image} alt={user.name} />}
        <AvatarFallback>
          {user?.name ?? (
            <HugeiconsIcon
              icon={User}
              className="text-muted-foreground inline-block size-5"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          )}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col gap-1.5">
        <Controller
          name="body"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <InputGroup className="h-9 rounded-full">
                <InputGroupTextarea
                  {...field}
                  rows={1}
                  maxLength={500}
                  placeholder={placeholder ?? t("Say something…")}
                  aria-invalid={fieldState.invalid}
                  className="max-h-16 min-h-auto resize-none py-1.5 leading-6"
                  onKeyDown={(e) => {
                    // A single-line pill reads as a chat input — Enter
                    // sends, same as every messaging app; Shift+Enter
                    // still gets you an actual newline in the 500-char
                    // body if you want one.
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                />
                <InputGroupAddon align="inline-end">
                  {editing && (
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      aria-label={t("Cancel")}
                      disabled={isSaving}
                      onClick={cancelEdit}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                    </InputGroupButton>
                  )}
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={t("Add photos")}
                    disabled={isSaving}
                    onClick={() => imageFieldRef.current?.openPicker()}
                    className={
                      imageSlots.length > 0 ? "text-primary" : undefined
                    }
                  >
                    <HugeiconsIcon icon={ImageAdd01Icon} className="size-4" />
                  </InputGroupButton>
                  <InputGroupButton
                    type="submit"
                    size="icon-xs"
                    aria-label={editing ? t("Save") : parentId ? t("Reply") : t("Post")}
                    disabled={!field.value.trim() || isSaving}
                  >
                    <HugeiconsIcon icon={SentIcon} className="size-4" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Mounted unconditionally (not just when there are images) so
            `imageFieldRef` is always ready to open the picker — its
            visible preview only actually renders once `imageSlots` has
            something in it. `hideAddButton`: this box's own icon above
            is the one and only way to add photos here, so the field's
            own "Add photos" button (`new-thread-composer.tsx` still
            uses it) would just be a redundant second one. */}
        <ImageUploadField
          ref={imageFieldRef}
          slots={imageSlots}
          onChange={setImageSlots}
          disabled={isSaving}
          hideAddButton
        />
      </div>
    </form>
  );
}
