import { BottomNav } from "@/components/bottom-nav";
import { StackTransition } from "@/components/navigation/screen";
import { getSession } from "@/lib/auth/session";

/**
 * Shell for the main tabs: page content + the bottom navigation bar. It
 * slides as one sheet when you leave the tabs or come back to them (the
 * screens inside slide on their own between tab screens).
 */
export default async function TabsLayout({ children }: LayoutProps<"/">) {
  // The cookie-cached session (no database query): Profile shows your photo.
  const user = (await getSession())?.user;
  return (
    <StackTransition>
      <div className="flex min-h-(--app-height) flex-col">
        {/* Clears the floating tab bar (--tab-bar) and the home indicator. */}
        <div className="flex flex-1 flex-col pb-[calc(var(--tab-bar)+var(--safe-bottom))]">
          {children}
        </div>
        <BottomNav user={user && { name: user.name, image: user.image ?? null }} />
      </div>
    </StackTransition>
  );
}
