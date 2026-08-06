import { BottomNav } from "@/components/bottom-nav";
import { DesktopTopBar } from "@/components/desktop-topbar";
import { getCurrentUser } from "@/lib/auth/guard";

type ExploreLayoutProps = React.PropsWithChildren;

/**
 * App-shell for `/`. On mobile it deliberately has no top-level
 * header — each page brings its own top bar (search bar on the home page,
 * `PageHeader` with a back button on sub-pages) so it reads like native app
 * screens, and `BottomNav` (mobile-only) covers site-wide navigation
 * instead. `DesktopTopBar` fills that same role once the bottom nav is
 * hidden at `sm` and up. `pb-24` clears the floating bottom nav (it no
 * longer sits flush against the edge, so needs more clearance than its own
 * height) on mobile; `sm:pb-8` removes that reserved space once the nav
 * itself is hidden.
 */
export default async function ExploreLayout({ children }: ExploreLayoutProps) {
  const user = await getCurrentUser();

  return (
    <div className="bg-background min-h-svh">
      <DesktopTopBar />
      <div className="pb-24 sm:pb-8">{children}</div>
      <BottomNav user={user} />
    </div>
  );
}
