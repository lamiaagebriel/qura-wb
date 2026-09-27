"use client";

import { usePathname } from "next/navigation";
import { createContext, use, useState, type ReactNode } from "react";

import { GoogleSignIn } from "@/components/auth/google-sign-in";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLocale } from "@/lib/i18n/provider";

type AuthSheetContextValue = {
  /** Opens the sign-in sheet; after signing in the user returns to `next`
   * (defaults to the current page). */
  open: (next?: string) => void;
};

const AuthSheetContext = createContext<AuthSheetContextValue | null>(null);

/**
 * Sign-in as a bottom sheet, available anywhere via `useAuthSheet()`.
 * The full `/login` page stays for flows that need a real redirect.
 */
export function AuthSheetProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const [state, setState] = useState<{ open: boolean; next?: string }>({
    open: false,
  });

  return (
    <AuthSheetContext
      value={{ open: (next) => setState({ open: true, next }) }}
    >
      {children}

      <Drawer
        open={state.open}
        onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("Sign in to Qura")}</DrawerTitle>
            <DrawerDescription>
              {t(
                "Discover restaurants, events, jobs, apartments, and more — all in one local feed. Launching in Aswan, expanding worldwide.",
              )}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4 px-4">
            <GoogleSignIn next={state.next ?? pathname} error={null} />
            <p className="text-center text-xs text-balance text-muted-foreground">
              {t("By continuing, you agree to our")} {t("Terms of Service")}{" "}
              {t("and")} {t("Privacy Policy")}.
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </AuthSheetContext>
  );
}

export function useAuthSheet() {
  const ctx = use(AuthSheetContext);
  if (!ctx)
    throw new Error("useAuthSheet must be used inside <AuthSheetProvider>");
  return ctx;
}
