"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

import { Button, type ButtonProps } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";

export function CopyLinkButton({
  value,
  copiedLabel,
  copyLabel,
  successToast,
  children,
  ...props
}: ButtonProps & {
  value: string;
  copyLabel: string;
  copiedLabel: string;
  successToast: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const succeeded = await copyToClipboard(value);
    if (!succeeded) {
      // Nothing actually got copied — surface the link itself so the user
      // can still grab it by hand instead of a dead-end error.
      toast.error(value);
      return;
    }
    setCopied(true);
    toast.success(successToast);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" onClick={handleClick} {...props}>
      <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} />
      {children ?? (copied ? copiedLabel : copyLabel)}
    </Button>
  );
}
