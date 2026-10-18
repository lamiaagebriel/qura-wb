import { BottomNav } from "@/components/bottom-nav";
import { StackTransition } from "@/components/navigation/screen";

/**
 * Shell for the main tabs: page content + the bottom navigation bar. It
 * slides as one sheet when you leave the tabs or come back to them (the
 * screens inside slide on their own between tab screens).
 */
export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <StackTransition>
      <div className="flex min-h-(--app-height) flex-col">
        {/* Clears the fixed bottom nav (h-16) and the home indicator. */}
        <div className="flex flex-1 flex-col pb-[calc(4rem+var(--safe-bottom))]">
          {children}
        </div>
        <BottomNav />
      </div>
    </StackTransition>
  );
}
