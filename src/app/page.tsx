import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/actions";

export default async function LandingPage() {
  const { t } = await getLocale();

  const steps = [
    {
      n: "01",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: t("Create your profile"),
      body: t(
        "Sign up in seconds. Pick your categories — restaurant, event organizer, landlord, whatever you are. Your profile goes live immediately.",
      ),
    },
    {
      n: "02",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
      title: t("Post your content"),
      body: t(
        "Share your menu, announce an event, post a rental, list a job. Everything you publish appears in the city feed instantly.",
      ),
    },
    {
      n: "03",
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
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
      badge: "bg-orange-100 text-orange-700",
      dot: "bg-orange-500",
      title: t("Summer Menu — 20% off all starters"),
      place: "Café Jasmine",
      city: "Sousse",
      time: "2h ago",
      hue: 47,
    },
    {
      type: "event",
      label: t("Event"),
      badge: "bg-violet-100 text-violet-700",
      dot: "bg-violet-500",
      title: t("Rooftop Jazz Night — Friday 9 PM"),
      place: "Le Nour",
      city: "Hammamet",
      time: "4h ago",
      hue: 280,
    },
    {
      type: "rental",
      label: t("Rental"),
      badge: "bg-sky-100 text-sky-700",
      dot: "bg-sky-500",
      title: t("Modern 2BR with sea view — 1 200 TND"),
      place: "Immo Côte d'Azur",
      city: "Sousse",
      time: "6h ago",
      hue: 210,
    },
    {
      type: "job",
      label: t("Job"),
      badge: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500",
      title: t("Looking for a barista — full time"),
      place: "Brew & Co",
      city: "Hammamet",
      time: "1d ago",
      hue: 150,
    },
  ];

  const stats = [
    { value: "2", unit: t("cities"), label: t("at launch") },
    { value: "0%", unit: t("commission"), label: t("ever") },
    { value: "1", unit: t("tap"), label: t("to reach you") },
  ];

  return (
    <div className="bg-background flex min-h-full flex-col">
      {/* ─── Nav ─── */}
      <header className="border-border/50 bg-background/85 sticky top-0 z-50 border-b backdrop-blur-xl">
        <nav className="container flex h-[58px] items-center justify-between">
          <span className="text-foreground text-[20px] font-bold tracking-tight">
            qura<span className="text-primary">.</span>
          </span>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-[13px] font-medium sm:inline-flex"
            >
              {t("Sign in")}
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-full px-4 text-[13px] font-semibold shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
            >
              {t("Get early access")}
            </Button>
          </div>
        </nav>
      </header>

      <main className="flex flex-1 flex-col">
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden pt-20 pb-16 sm:pt-32 sm:pb-24">
          {/* ambient glow */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-primary/10 absolute top-0 left-1/2 h-[520px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full blur-3xl" />
            <div className="absolute top-24 right-[10%] h-[300px] w-[300px] rounded-full bg-amber-200/20 blur-3xl" />
            <div className="absolute top-40 left-[5%] h-[200px] w-[200px] rounded-full bg-orange-100/30 blur-2xl" />
          </div>

          <div className="container max-w-4xl text-center">
            {/* badge */}
            <div className="border-primary/25 bg-primary/8 text-primary mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-medium">
              <span className="bg-primary size-2 animate-pulse rounded-full" />
              {t("Launching in Aswan")}
            </div>

            <h1 className="text-foreground mb-6 text-[52px] leading-[1.08] font-bold tracking-tight sm:text-[68px] lg:text-[80px]">
              {t("Your city,")}
              <br />
              <span className="text-primary">{t("one feed.")}</span>
            </h1>

            <p className="text-muted-foreground mx-auto mb-10 max-w-[540px] text-[17px] leading-relaxed sm:text-[19px]">
              {t(
                "Restaurants, events, rentals, jobs, homemade food, local services — everything happening around you, in a single scrollable feed.",
              )}
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full rounded-full px-8 text-[15px] font-semibold shadow-[0_6px_20px_rgba(249,115,22,0.32)] sm:w-auto"
              >
                {t("Create your profile — it's free")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-full px-8 text-[15px] font-semibold sm:w-auto"
                asChild
              >
                <Link href="/explore">{t("Explore the feed →")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Stats strip ─── */}
        <section className="pb-16">
          <div className="container max-w-3xl">
            <div className="border-border grid grid-cols-3 gap-3 rounded-[22px] border bg-white p-5 shadow-sm sm:gap-6 sm:p-7">
              {stats.map(({ value, unit, label }) => (
                <div
                  key={unit}
                  className="flex flex-col items-center text-center"
                >
                  <div className="text-foreground text-[30px] leading-none font-bold sm:text-[38px]">
                    {value}
                    <span className="text-primary ml-1 text-[18px] font-semibold sm:text-[22px]">
                      {unit}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-1 text-[12px] sm:text-[13px]">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Feed preview ─── */}
        <section className="pb-24">
          <div className="container max-w-5xl">
            <div className="mb-10 text-center">
              <p className="text-muted-foreground mb-2 text-[12px] font-semibold tracking-[0.12em] uppercase">
                {t("Live in your city right now")}
              </p>
              <h2 className="text-[28px] font-bold tracking-tight sm:text-[34px]">
                {t("One feed, every category")}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {feedCards.map((card) => (
                <div
                  key={card.type}
                  className="border-border flex flex-col gap-4 rounded-[18px] border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* color bar */}
                  <div
                    className="h-[90px] w-full overflow-hidden rounded-[12px]"
                    style={{
                      background: `linear-gradient(135deg, oklch(74% 0.13 ${card.hue}), oklch(62% 0.16 ${(card.hue + 40) % 360}))`,
                    }}
                  />
                  <div>
                    <span
                      className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${card.badge}`}
                    >
                      {card.label}
                    </span>
                    <p className="text-foreground text-[13.5px] leading-snug font-semibold">
                      {card.title}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className={`size-1.5 rounded-full ${card.dot}`} />
                      <p className="text-muted-foreground text-[11.5px]">
                        {card.place} · {card.city} · {card.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Map preview banner ─── */}
        <section className="pb-24">
          <div className="container max-w-5xl">
            <div className="border-border relative overflow-hidden rounded-[24px] border bg-white shadow-sm">
              {/* CSS map mockup */}
              <div
                className="h-[220px] w-full sm:h-[260px]"
                style={{
                  background:
                    "linear-gradient(160deg, oklch(88% 0.04 220) 0%, oklch(92% 0.03 200) 100%)",
                }}
              >
                {/* roads */}
                <div className="absolute inset-0 opacity-60">
                  <div className="absolute top-[45%] right-0 left-0 h-[6px] bg-white/80" />
                  <div className="absolute top-0 bottom-0 left-[38%] w-[5px] bg-white/80" />
                  <div className="absolute top-[70%] right-0 left-0 h-[4px] bg-white/70" />
                  <div className="absolute top-0 bottom-0 left-[65%] w-[4px] bg-white/70" />
                  <div className="absolute top-[25%] right-0 left-[10%] h-[3px] rotate-6 bg-white/50" />
                </div>
                {/* park */}
                <div className="absolute top-[10%] left-[50%] h-[70px] w-[100px] rounded-2xl bg-green-200/50" />
                {/* pins */}
                {[
                  { x: "28%", y: "30%", color: "bg-orange-500" },
                  { x: "55%", y: "55%", color: "bg-violet-500" },
                  { x: "70%", y: "28%", color: "bg-sky-500" },
                  { x: "42%", y: "72%", color: "bg-emerald-500" },
                ].map(({ x, y, color }, i) => (
                  <div
                    key={i}
                    className="absolute flex flex-col items-center"
                    style={{
                      left: x,
                      top: y,
                      transform: "translate(-50%, -100%)",
                    }}
                  >
                    <div
                      className={`flex size-7 items-center justify-center rounded-full ${color} text-white shadow-lg ring-2 ring-white`}
                    >
                      <div className="size-2 rounded-full bg-white/80" />
                    </div>
                    <div className={`h-2 w-0.5 ${color}`} />
                  </div>
                ))}
                {/* you are here */}
                <div className="absolute top-[44%] left-[38%] -translate-x-1/2 -translate-y-1/2">
                  <div className="size-3 rounded-full bg-blue-500 ring-2 ring-white ring-offset-1 ring-offset-blue-100" />
                  <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-40" />
                </div>
              </div>

              {/* overlay card */}
              <div className="border-border border-t px-5 py-4 sm:px-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-semibold">
                      4 places near you
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                      Sorted by distance · Sousse
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-full px-5 text-[13px] shadow-[0_4px_12px_rgba(249,115,22,0.25)]"
                    asChild
                  >
                    <Link href="/explore">{t("Explore map →")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Categories ─── */}
        <section className="border-border bg-muted/30 border-y py-20">
          <div className="container max-w-5xl">
            <div className="mb-12 text-center">
              <p className="text-muted-foreground mb-2 text-[12px] font-semibold tracking-[0.12em] uppercase">
                {t("Every category")}
              </p>
              <h2 className="text-[28px] font-bold tracking-tight sm:text-[34px]">
                {t("Everything in one place")}
              </h2>
              <p className="text-muted-foreground mt-3 text-[15px]">
                {t("One account. Pick your categories. Reach your whole city.")}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
              {categories.map(({ emoji, label }) => (
                <div
                  key={label}
                  className="border-border hover:border-primary/30 flex flex-col items-center gap-2.5 rounded-[16px] border bg-white px-3 py-4 text-center transition-all hover:shadow-md"
                >
                  <span className="text-[26px]">{emoji}</span>
                  <span className="text-foreground text-[12px] leading-tight font-medium">
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
            <div className="mb-16 text-center">
              <p className="text-muted-foreground mb-2 text-[12px] font-semibold tracking-[0.12em] uppercase">
                {t("How it works")}
              </p>
              <h2 className="text-[28px] font-bold tracking-tight sm:text-[34px]">
                {t("Up and running in minutes")}
              </h2>
              <p className="text-muted-foreground mt-3 text-[15px]">
                {t("No technical skills required. No approval process.")}
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {steps.map(({ n, icon, title, body }) => (
                <div
                  key={n}
                  className="border-border flex flex-col gap-4 rounded-[20px] border bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-[12px]">
                      {icon}
                    </div>
                    <span className="text-muted-foreground text-[13px] font-bold tracking-widest">
                      {n}
                    </span>
                  </div>
                  <h3 className="text-[17px] leading-tight font-semibold">
                    {title}
                  </h3>
                  <p className="text-muted-foreground text-[13.5px] leading-relaxed">
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
            <div className="border-border overflow-hidden rounded-[22px] border bg-white shadow-sm">
              <div className="flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:gap-8 sm:p-9">
                <div className="flex size-[60px] shrink-0 items-center justify-center rounded-[16px] bg-green-50">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="#22c55e"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-[19px] leading-tight font-bold">
                    {t("WhatsApp is the only CTA")}
                  </h3>
                  <p className="text-muted-foreground max-w-xl text-[13.5px] leading-relaxed">
                    {t(
                      "No in-app payments. No booking forms. When a customer is ready, they tap one button and land in your WhatsApp chat with the full order or inquiry already typed. You handle it your way, on your terms.",
                    )}
                  </p>
                </div>
                <div className="shrink-0">
                  <div className="inline-flex items-center gap-2 rounded-[10px] bg-green-500 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_4px_14px_rgba(34,197,94,0.3)]">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                    </svg>
                    Send on WhatsApp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="mx-4 mb-16 overflow-hidden rounded-[26px] sm:mx-6">
          <div
            className="relative overflow-hidden px-6 py-20 sm:px-12"
            style={{
              background:
                "linear-gradient(135deg, oklch(18% 0.015 260) 0%, oklch(12% 0.01 260) 100%)",
            }}
          >
            {/* glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="bg-primary/20 absolute top-0 left-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-3xl text-center">
              <p className="mb-4 text-[12px] font-semibold tracking-[0.14em] text-white/40 uppercase">
                {t("Be first")}
              </p>
              <h2 className="mb-5 text-[32px] leading-[1.1] font-bold tracking-tight text-white sm:text-[48px]">
                {t("Your city is waiting.")}
                <br />
                <span className="text-white/40">
                  {t("Put yourself on the map.")}
                </span>
              </h2>
              <p className="mb-10 text-[15px] leading-relaxed text-white/55 sm:text-[17px]">
                {t(
                  "Create your free profile today. No credit card. No approval.",
                )}
                <br />
                {t("Go live in minutes.")}
              </p>
              <Button
                size="lg"
                className="h-12 rounded-full px-10 text-[15px] font-semibold shadow-[0_6px_24px_rgba(249,115,22,0.4)]"
              >
                {t("Create your free profile")}
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-border border-t px-4 py-8 sm:px-6">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-foreground text-[17px] font-bold">
            qura<span className="text-primary">.</span>
          </span>
          <p className="text-muted-foreground text-[12px]">
            {t("Launching in Aswan — Egypt")}
          </p>
          <p className="text-muted-foreground text-[12px]">
            &copy; {new Date().getFullYear()} Qura
          </p>
        </div>
      </footer>
    </div>
  );
}
