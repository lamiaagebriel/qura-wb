"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import { ImageAdd01Icon, SentIcon, User } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldError } from "@/components/ui/field";
import { ImageUploadField } from "@/components/image-upload-field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { createThreadAction } from "@/lib/threads/actions/create";
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
  const schema = useMemo(() => createThreadSchema(t), [t]);
  // Same role as `new-thread-composer.tsx`'s own — every image URL this
  // reply box has uploaded, so `ImageUploadField.removeImage` knows
  // they're safe to delete immediately if backed out of. This box has
  // no explicit "cancel" (it's always visible, not a modal), so anything
  // left uploaded-but-never-posted here relies on the cron sweep
  // (`sweepOrphanedThreadImages`) rather than an on-close cleanup call.
  const sessionUploadsRef = useRef<Set<string>>(new Set());

  const form = useForm<ThreadValues>({
    resolver: createZodResolver(schema),
    defaultValues: { body: "", images: [], parentId },
  });

  async function onSubmit(values: ThreadValues) {
    if (!user?.id) {
      promptSignIn();
      return;
    }

    const result = await createThreadAction(values);
    if (!result.success) {
      handleAppError(result.error, form);
      return;
    }
    sessionUploadsRef.current.clear();
    form.reset({ body: "", images: [], parentId });
    setShowImages(false);
    router.refresh();
    onPosted?.();
  }

  return (
    <form
      // `onSubmit` only ever reads `sessionUploadsRef.current` from
      // inside the real submit handler `handleSubmit` invokes on
      // `submit`, never during render; the rule can't see through
      // `react-hook-form`'s own wrapper to confirm that statically.
      // eslint-disable-next-line react-hooks/refs
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
          <Controller
            name="images"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <ImageUploadField
                  images={field.value}
                  onChange={field.onChange}
                  sessionUploadsRef={sessionUploadsRef}
                  disabled={form.formState.isSubmitting}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}
      </div>
    </form>
  );
}
