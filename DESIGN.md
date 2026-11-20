# Qura design

How Qura looks and feels. Read this before building or changing any screen. Code rules live in `AGENTS.md`; colour tokens live in `src/app/globals.css`.

## 1. Feel

A local city feed that feels like a native phone app, not a website: instant, quiet, thumb-first. Everything is for one hand on a phone; desktop just shows the same phone column.

- Arabic and English are equal; every screen works right-to-left and left-to-right.
- Light and dark modes are equal (system by default, switchable); every colour comes from a token that has both.
- Calm and neutral: black, white and greys from the shadcn preset; colour only means something (destructive, a status, a rating star).

## 2. Colour

Use the tokens, never raw colours. They come from the shadcn preset (`b3S8pyK7k`, neutral base) and flip in dark mode.

| Token | Role |
|---|---|
| `background` / `foreground` | The screen and its text. |
| `card` | Raised groups: settings lists, detail cards, the status switch. |
| `primary` / `primary-foreground` | The one main action on a screen (near-black, near-white in dark). |
| `secondary`, `muted`, `accent` | Quiet buttons, fields, chips, pressed states. |
| `muted-foreground` | Hints, labels, counts, timestamps. |
| `destructive` | Delete, errors and "hidden" notices only. |
| `border`, `input`, `ring` | Lines, fields, focus. |

Allowed exceptions, each with its own meaning: amber for rating stars (`text-amber-500`), and status pills (`BusinessStatusBadge`, the place request cards) with soft tinted backgrounds (`bg-amber-500/15 text-amber-700`, `bg-emerald-500/15 …`), always paired with their `dark:` variant.

Brand colours (the app icon, splash screens) are in `lib/brand.ts`; `theme-color` is managed by `<ThemeColor>`, never set per page.

## 3. Type

- **Cairo** for everything, every locale (`font-sans`, `font-heading`).
- Text sizes are Mira's (the `components/ui` defaults): never enlarge a field's, button's or sheet title's text with `text-base`. Fields are 44px tall (`INPUT`, `size="xl"`) with Mira text; on phones `globals.css` lifts input, textarea and select text to 16px, so iOS never zooms on focus.
- Never set letter-spacing on Arabic; avoid `tracking-*`.
- Numbers that change or line up (counts, scores, prices) use `tabular-nums`, formatted with `Intl.NumberFormat(locale)`.
- Scale: large tab titles come from `<AppHeader large>`; section labels `text-sm font-medium`; hints `text-xs`/`text-sm text-muted-foreground`.

## 4. Components

- shadcn/ui (`components/ui`, style `base-mira`, Base UI, RTL on) for every primitive. Icons: Hugeicons through `components/icons` only; the stroke is set once there (`ICON_STROKE`, the preset's) — never pass `strokeWidth` per icon, and inside a button leave out the icon size (the button sets it).
- **Screens**: every page is a `<Screen>` with one `<AppHeader>` (`large` on tab roots, `back` on detail screens, at most one `action`).
- **Sheets, not menus**: bottom sheets are the vaul `Drawer`, controlled (back closes it first). Options → `ActionSheet`; confirmations → `ConfirmSheet`; asking why → `ReasonSheet` (`components/sheets`). Never dropdown menus, popovers, `alert()` or `confirm()`.
- **Follow the preset, don't restyle it**: the look comes from the shadcn preset (`components.json`, `globals.css`), so changing the preset restyles the app. Don't set text sizes on controls (buttons, fields, rows, pills, chips, sheet titles): they take the preset's. Only page text (titles, headings, body, hints) and layout (heights, spacing, radius) are ours.
- **Native buttons**: a hand-built `<button>` or link that looks like a control starts from `buttonVariants({ variant, size })` and adds only its shape on top, so focus, disabled, pressed, text and icon sizing follow the preset. Rows of a card list (settings, sheet options) use `LIST_ROW` (`components/list-row.ts`; `STATIC_ROW` for a row that holds its own controls) — it already restores the `divide-y` line. Only pure image tiles (a map preview, an avatar choice) skip it.
- **Select and date**: `Select` (`components/select.tsx`) and `DatePicker` (`components/date-picker.tsx`), with `SelectField` / `DateField` for forms, show the native wheel on iPhone and iPad (`useIsIos`) and shadcn's dropdown / calendar elsewhere. Built, not used yet: lists still open as sheets until a screen is moved to them.
- **Forms** (`components/forms`): one field per row, label above, error below (`FormError`); the main button full-width at the bottom (`size="xl" className="w-full rounded-xl"`), with a spinner while pending.
- **Groups**: settings and detail lists are one rounded card (`rounded-2xl bg-card ring-1 ring-foreground/5`) with `divide-y` rows, each row at least 44px.
- **Feedback**: toasts (`components/ui/toast`) sit above the tab bar; errors are a toast unless they belong to a form field. Empty, error and signed-out screens use `<StatusScreen>` (icon, title, one line, one action).
- **Loading**: every screen has a `loading.tsx` skeleton shaped like the screen (`components/skeletons.tsx`: `Bone`, `SkeletonBody`, `PostSkeleton`, `ListCardSkeleton`), inside the same `<Screen>` and `<AppHeader>`.
- **Refreshing**: screens that show changing data wrap their content (under the header) in `<PullToRefresh>` (`router.refresh()` by default, or `onRefresh` for client data).

## 5. Layout

- One phone column: content is `mx-auto w-full max-w-md px-4`, stacked with `gap-4`–`gap-6`, `pb-8` at the end.
- Logical properties only: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`. Arrows along the reading direction get `rtl:rotate-180`.
- Heights and safe areas only through the iOS-corrected variables in `globals.css`: `min-h-(--app-height)`, `pt-[var(--safe-top)]`, `pb-[var(--safe-bottom)]`. Never `vh`/`dvh` or raw `env(safe-area-inset-*)`.
- Text inside flex rows gets `min-w-0` and `truncate`; user text gets `dir="auto"`.
- Radius: `rounded-xl` for buttons and fields, `rounded-2xl` for cards and groups, `rounded-full` for avatars, chips and icon buttons.
- Flat: depth comes from `bg-card` and a faint ring (`ring-foreground/5`), not shadows.

## 6. Touch & keyboard

- Tap targets at least 44px (`size-11`, `h-11`, `size="xl"` buttons). A smaller-looking control keeps a 44px tap area (a `before:`/`after:` inset).
- Touch behaviour lives in `globals.css` (no tap highlight, no double-tap zoom, no page rubber-band, a pressed state on touch); don't override it per component.
- Fields get the right `enterKeyHint`, `inputMode` and `autoComplete`; submitting closes the keyboard.
- `<KeyboardObserver>` sets `html[data-keyboard=open]` (the tab bar hides) and `--keyboard-inset`: a bar that must sit on the keyboard uses `bottom: var(--keyboard-inset)`. Dragging or tapping empty space closes the keyboard (opt out with `data-keep-keyboard`).
- A short vibration (`navigator.vibrate`) only for a real choice (picking a star, posting); never on every tap.

## 7. Navigation & motion

- Deeper screens slide in: open them with `<StackLink>` (a real `<Link prefetch transitionTypes={[navType(...)]}>`), never a plain `<Link>`, `router.push()` or `addTransitionType` (on dynamic screens the router commits twice and the wrong page slides).
- Tabs (`lib/navigation.ts`) are plain links to their root; no slide.
- The back arrow (`BackButton`) goes back like the browser when an in-app screen is behind it; on a deep link it replaces the screen with the `back` parent, sliding back, so back never leaves the app.
- In the installed app an edge swipe goes back on any screen with a back arrow (`use-swipe-back.ts`): no horizontal swipe gestures at the screen edges.
- Motion is short and purposeful: slides between screens, sheets rising, a pressed state. Nothing bounces or loops.

## 8. Phone integration

- Share with `useShare()` (`lib/share.ts`: the native share sheet, else copy the link and toast).
- App icons and iOS splash screens are drawn in `lib/brand-images.tsx` from `lib/brand.ts`; replace the placeholder mark there.
- Offline: visited pages open from the saved copy, others show `/offline`, with `<OfflineBanner>` while offline.
