"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLocale } from "@/lib/i18n/client";

type AuthPromptContextValue = {
  /** Opens the "sign in required" drawer. Call this from any client
   * component's click handler once it's already determined the user is
   * signed out — this doesn't check auth state itself, it's just the
   * shared UI for what happens next. */
  promptSignIn: () => void;
};

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

/** Mounted once at the root (`app/layout.tsx`) so every client component
 * anywhere in the tree can pull `promptSignIn` via `useAuthPrompt()`
 * instead of each wiring up its own "you need to sign in" dialog. */
export function AuthPromptProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AuthPromptContext.Provider value={{ promptSignIn: () => setOpen(true) }}>
      {children}
      <AuthPromptDrawer open={open} onOpenChange={setOpen} />
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt(): AuthPromptContextValue {
  const ctx = useContext(AuthPromptContext);
  if (!ctx) {
    throw new Error("useAuthPrompt must be used inside <AuthPromptProvider>");
  }
  return ctx;
}

function AuthPromptDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useLocale();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t("Sign in to continue")}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-3 px-4 pb-6">
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            {t("You need an account to do that.")}
          </p>
          <Button asChild onClick={() => onOpenChange(false)}>
            <Link href="/login">{t("Sign in")}</Link>
          </Button>
          <Button asChild variant="outline" onClick={() => onOpenChange(false)}>
            <Link href="/signup">{t("Create an account")}</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
