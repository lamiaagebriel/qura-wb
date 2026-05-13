import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getLocale } from "@/lib/i18n/actions";

export default async function LandingPage() {
  const { t } = await getLocale();

  const steps = [
    {
      n: "01",
      title: t("Create your profile"),
      body: t(
        "Sign up in seconds. Pick your categories — restaurant, event organizer, landlord, whatever you are. Your profile goes live immediately.",
      ),
    },
    {
      n: "02",
      title: t("Post your content"),
      body: t(
        "Share your menu, announce an event, post a rental, list a job. Everything you publish appears in the city feed instantly.",
      ),
    },
    {
      n: "03",
      title: t("Connect on WhatsApp"),
      body: t(
        "Every inquiry, order, or reservation goes straight to your WhatsApp. No middleman. No commission. Just real conversations.",
      ),
    },
  ];

  const categories = [
    { emoji: "🍽️", label: t("Restaurants") },
    { emoji: "☕", label: t("Cafés") },
    { emoji: "🏠", label: t("Real Estate") },
    { emoji: "🎉", label: t("Events") },
    { emoji: "💼", label: t("Jobs") },
    { emoji: "🛍️", label: t("Shopping") },
    { emoji: "🍱", label: t("Homemade Food") },
    { emoji: "🏋️", label: t("Activities") },
    { emoji: "🚗", label: t("Cars") },
    { emoji: "💆", label: t("Health & Beauty") },
    { emoji: "📚", label: t("Education") },
    { emoji: "🔧", label: t("Services") },
  ];

  const feedCards = [
    {
      type: "offer",
      label: t("Offer"),
      color: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      title: t("Summer Menu — 20% off all starters"),
      meta: t("Café Jasmine · Sousse · 2h ago"),
    },
    {
      type: "event",
      label: t("Event"),
      color: "bg-violet-50 border-violet-200",
      badge: "bg-violet-100 text-violet-700",
      title: t("Rooftop Jazz Night — Friday 9 PM"),
      meta: t("Le Nour · Hammamet · 4h ago"),
    },
    {
      type: "rental",
      label: t("Rental"),
      color: "bg-sky-50 border-sky-200",
      badge: "bg-sky-100 text-sky-700",
      title: t("Modern 2BR with sea view — 1 200 TND"),
      meta: t("Immo Côte d'Azur · Sousse · 6h ago"),
    },
    {
      type: "job",
      label: t("Job"),
      color: "bg-emerald-50 border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      title: t("Looking for a barista — full time"),
      meta: t("Brew & Co · Hammamet · 1d ago"),
    },
  ];
  return (
    <div className="flex min-h-full flex-col">
      {/* ─── Nav ─── */}
      <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
        <nav className="container flex h-14 items-center justify-between">
          <span className="text-foreground text-lg font-bold tracking-tight">
            qura<span className="text-primary">.</span>
          </span>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              {t("Sign in")}
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-full px-4 text-sm font-semibold"
            >
              {t("Get early access")}
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-primary/10 absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl" />
          </div>

          <div className="container max-w-4xl text-center">
            <div className="border-primary/30 bg-primary/8 text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
              <span className="bg-primary size-2 animate-pulse rounded-full" />
              {t("Launching in Sousse & Hammamet")}
            </div>

            <h1 className="text-foreground mb-6 text-5xl leading-[1.1] font-bold tracking-tight sm:text-6xl lg:text-7xl">
              {t("Your city,")}
              <br />
              <span className="text-primary">{t("one feed.")}</span>
            </h1>

            <p className="text-muted-foreground mx-auto mb-10 max-w-xl text-lg leading-relaxed sm:text-xl">
              {t(
                "Restaurants, events, rentals, jobs, homemade food, local services — everything happening around you, in a single scrollable feed.",
              )}
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full rounded-full px-8 text-base font-semibold sm:w-auto"
              >
                {t("Create your profile — it's free")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-full px-8 text-base font-semibold sm:w-auto"
              >
                {t("Explore the feed →")}
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Feed preview ─── */}
        <section className="pb-24">
          <div className="container max-w-5xl">
            <p className="text-muted-foreground mb-8 text-center text-sm font-medium tracking-widest uppercase">
              {t("Live in your city right now")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {feedCards.map((card) => (
                <div
                  key={card.type}
                  className={`rounded-2xl border p-5 ${card.color}`}
                >
                  <span
                    className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${card.badge}`}
                  >
                    {card.label}
                  </span>
                  <p className="text-foreground mb-3 text-sm leading-snug font-semibold">
                    {card.title}
                  </p>
                  <p className="text-muted-foreground text-xs">{card.meta}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Categories ─── */}
        <section className="border-border bg-muted/40 border-y py-20">
          <div className="container max-w-5xl">
            <div className="mb-12 text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {t("Everything in one place")}
              </h2>
              <p className="text-muted-foreground">
                {t("One account. Pick your categories. Reach your whole city.")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {categories.map(({ emoji, label }) => (
                <div
                  key={label}
                  className="border-border bg-card flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition-shadow hover:shadow-md"
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-foreground text-xs leading-tight font-medium">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section className="py-24">
          <div className="container max-w-5xl">
            <div className="mb-14 text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {t("Up and running in minutes")}
              </h2>
              <p className="text-muted-foreground">
                {t("No technical skills required. No approval process.")}
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map(({ n, title, body }) => (
                <div key={n} className="flex flex-col gap-4">
                  <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl text-lg font-bold">
                    {n}
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WhatsApp callout ─── */}
        <section className="pb-24">
          <div className="container max-w-5xl">
            <div className="border-border bg-card flex flex-col items-start gap-6 rounded-3xl border p-8 shadow-sm sm:flex-row sm:items-center sm:p-10">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-3xl">
                💬
              </div>
              <div>
                <h3 className="mb-1.5 text-xl font-bold">
                  {t("WhatsApp is the only CTA")}
                </h3>
                <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
                  {t(
                    "No in-app payments. No booking forms. When a customer is ready, they tap one button and land in your WhatsApp chat with the full order or inquiry already typed. You handle it your way, on your terms.",
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="bg-foreground text-background mx-4 mb-16 overflow-hidden rounded-3xl px-6 py-20 sm:mx-6 sm:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-background/50 mb-4 text-sm font-medium tracking-widest uppercase">
              {t("Be first")}
            </p>
            <h2 className="mb-5 text-3xl font-bold tracking-tight sm:text-5xl">
              {t("Your city is waiting.")}
              <br />
              <span className="text-muted-foreground">
                {t("Put yourself on the map.")}
              </span>
            </h2>
            <p className="text-background/60 mb-10 text-base whitespace-pre-line sm:text-lg">
              {t(
                "Create your free profile today. No credit card. No approval.\nGo live in minutes.",
              )}
            </p>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-full px-10 text-base font-semibold"
            >
              {t("Create your free profile")}
            </Button>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-border border-t px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-foreground text-base font-bold">
            qura<span className="text-primary">.</span>
          </span>
          <p className="text-muted-foreground text-xs">
            {t("Launching in Sousse & Hammamet — Tunisia")}
          </p>
          <p className="text-muted-foreground text-xs">
            &copy; {new Date().getFullYear()} Qura
          </p>
        </div>
      </footer>
    </div>
  );
}
