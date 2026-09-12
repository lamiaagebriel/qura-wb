"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageAdd01Icon, SentIcon, User } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldError } from "@/components/ui/field";
import { ImageUploadField, type ImageSlot } from "@/components/image-upload-field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { createThreadAction } from "@/lib/threads/actions/create";
import { discardThreadImagesAction } from "@/lib/storage/actions";
import { resolvePendingSlots } from "@/lib/threads/resolve-pending-slots";
import { deletePendingImage } from "@/lib/threads/pending-image-store";
import { handleAppError } from "@/lib/errors-client";
import { useLocale } from "@/lib/i18n/client";
import {
  createThreadSchema,
  type ThreadValues,
} from "@/lib/validations/thread";
import { createZodResolver } from "@/lib/validations/resolver";
import { useAuthPrompt } from "./auth-prompt";

export function ComposeBox({
  user,
  parentId,
  placeholder,
  onPosted,
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
}) {
  const { t } = useLocale();
  const router = useRouter();
  const { promptSignIn } = useAuthPrompt();
  const [showImages, setShowImages] = useState(false);
  // Staged locally, not uploaded, until this box's own submit — same
  // deferred-upload staging `new-thread-composer.tsx` uses (see
  // `image-upload-field.tsx` and `resolvePendingSlots`). This box has no
  // explicit "cancel" (it's always visible, not a modal); a pending
  // image never posted just sits in IndexedDB until the tab closes or
  // it's manually removed here — nothing was ever uploaded to S3 for it
  // to orphan there in the meantime.
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
  const schema = useMemo(() => createThreadSchema(t), [t]);

  const form = useForm<Pick<ThreadValues, "body">>({
    resolver: createZodResolver(schema.pick({ body: true })),
    defaultValues: { body: "" },
  });

  async function onSubmit(values: { body: string }) {
    if (!user?.id) {
      promptSignIn();
      return;
    }

    const resolved = await resolvePendingSlots(imageSlots);
    if (!resolved.ok) {
      if (resolved.uploadedUrls.length > 0) {
        void discardThreadImagesAction(resolved.uploadedUrls);
      }
      handleAppError({
        kind: "message",
        message: t("Couldn't upload one of your images. Please try again."),
      });
      return;
    }

    const result = await createThreadAction({
      body: values.body,
      images: resolved.urls,
      category: "general",
      parentId,
    });
    if (!result.success) {
      if (resolved.urls.length > 0) void discardThreadImagesAction(resolved.urls);
      handleAppError(result.error, form);
      return;
    }

    for (const slot of imageSlots) {
      if (slot.kind === "pending") void deletePendingImage(slot.id);
    }
    form.reset({ body: "" });
    setImageSlots([]);
    setShowImages(false);
    router.refresh();
    onPosted?.();
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
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={showImages ? t("Remove image") : t("Add image")}
                    aria-pressed={showImages}
                    onClick={() => setShowImages((v) => !v)}
                    className={showImages ? "text-primary" : undefined}
                  >
                    <HugeiconsIcon icon={ImageAdd01Icon} className="size-4" />
                  </InputGroupButton>
                  <InputGroupButton
                    type="submit"
                    size="icon-xs"
                    aria-label={parentId ? t("Reply") : t("Post")}
                    disabled={form.formState.isSubmitting}
                  >
                    <HugeiconsIcon icon={SentIcon} className="size-4" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {showImages && (
          <Field>
            <ImageUploadField
              slots={imageSlots}
              onChange={setImageSlots}
              disabled={form.formState.isSubmitting}
            />
          </Field>
        )}
      </div>
    </form>
  );
}
