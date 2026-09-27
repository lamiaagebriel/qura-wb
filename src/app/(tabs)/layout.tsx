import { BottomNav } from "@/components/bottom-nav";

/** Shell for the main tabs: page content + the bottom navigation bar. */
export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-(--app-height) flex-col">
      {/* Clears the fixed bottom nav (h-16) and the home indicator. */}
      <div className="flex flex-1 flex-col pb-[calc(4rem+var(--safe-bottom))]">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
