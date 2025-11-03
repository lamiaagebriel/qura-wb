import { getDictionary } from "@/servers/locale";

type HomeProps = Readonly<{}>;
export default async function Home({}: HomeProps) {
  const dic = await getDictionary();

  const c = dic["marketing"];
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section id="hero" className="border-b">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              {c.hero["headline"] ?? dic["site"]["name"]}
            </h1>
            <p className="text-muted-foreground mt-4 text-lg text-balance md:text-xl">
              {c.hero["subheadline"]}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#pricing"
                className="bg-foreground text-background inline-flex items-center rounded-md px-5 py-3 transition-colors hover:opacity-90"
              >
                {c.hero["ctas"]["getStarted"]}
              </a>
              <a
                href="#contact"
                className="hover:bg-accent inline-flex items-center rounded-md border px-5 py-3"
              >
                {c.hero["ctas"]["talkToSales"]}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/20 border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              {c.howItWorks["title"]}
            </h2>
            <p className="text-muted-foreground mt-3">
              {c.howItWorks["subtitle"]}
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(c.howItWorks["steps"] ?? []).map((step: any, idx: number) => (
              <div key={idx} className="bg-background rounded-lg border p-6">
                <div className="text-primary text-sm font-semibold">{`Step ${idx + 1}`}</div>
                <h3 className="mt-1 text-xl font-semibold">{step["title"]}</h3>
                <p className="text-muted-foreground mt-2">
                  {step["description"]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              {c.benefits["title"]}
            </h2>
            <p className="text-muted-foreground mt-3">
              {c.benefits["subtitle"]}
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(c.benefits["items"] ?? []).map((item: any, idx: number) => (
              <div key={idx} className="rounded-lg border p-6">
                <h3 className="text-lg font-semibold">{item["title"]}</h3>
                <p className="text-muted-foreground mt-2">
                  {item["description"]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-muted/20 border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              {c.pricing["title"]}
            </h2>
            <p className="text-muted-foreground mt-3">
              {c.pricing["subtitle"]}
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="bg-background flex flex-col rounded-lg border p-6">
              <h3 className="text-xl font-semibold">
                {c.pricing["plans"]["starter"]["name"]}
              </h3>
              <p className="text-muted-foreground mt-1">
                {c.pricing["plans"]["starter"]["tagline"]}
              </p>
              <div className="mt-4 text-4xl font-bold">
                {c.pricing["plans"]["starter"]["price"]}
              </div>
              <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                {(c.pricing["plans"]["starter"]["features"] ?? []).map(
                  (f: string, i: number) => (
                    <li key={i}>{f}</li>
                  )
                )}
              </ul>
              <a
                href="#contact"
                className="hover:bg-accent mt-6 inline-flex items-center justify-center rounded-md border px-4 py-2"
              >
                Choose Starter
              </a>
            </div>
            <div className="bg-background ring-primary relative flex flex-col rounded-lg border p-6 ring-2">
              <div className="bg-primary text-primary-foreground absolute top-4 right-4 rounded px-2 py-1 text-xs font-medium">
                {c.pricing["popularLabel"]}
              </div>
              <h3 className="text-xl font-semibold">
                {c.pricing["plans"]["growth"]["name"]}
              </h3>
              <p className="text-muted-foreground mt-1">
                {c.pricing["plans"]["growth"]["tagline"]}
              </p>
              <div className="mt-4 text-4xl font-bold">
                {c.pricing["plans"]["growth"]["price"]}
              </div>
              <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                {(c.pricing["plans"]["growth"]["features"] ?? []).map(
                  (f: string, i: number) => (
                    <li key={i}>{f}</li>
                  )
                )}
              </ul>
              <a
                href="#contact"
                className="bg-foreground text-background mt-6 inline-flex items-center justify-center rounded-md px-4 py-2 hover:opacity-90"
              >
                Choose Growth
              </a>
            </div>
            <div className="bg-background flex flex-col rounded-lg border p-6">
              <h3 className="text-xl font-semibold">
                {c.pricing["plans"]["scale"]["name"]}
              </h3>
              <p className="text-muted-foreground mt-1">
                {c.pricing["plans"]["scale"]["tagline"]}
              </p>
              <div className="mt-4 text-4xl font-bold">
                {c.pricing["plans"]["scale"]["price"]}
              </div>
              <ul className="text-muted-foreground mt-4 space-y-2 text-sm">
                {(c.pricing["plans"]["scale"]["features"] ?? []).map(
                  (f: string, i: number) => (
                    <li key={i}>{f}</li>
                  )
                )}
              </ul>
              <a
                href="#contact"
                className="hover:bg-accent mt-6 inline-flex items-center justify-center rounded-md border px-4 py-2"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              {c.faq["title"]}
            </h2>
            <p className="text-muted-foreground mt-3">{c.faq["subtitle"]}</p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {(c.faq["items"] ?? []).map((it: any, i: number) => (
              <details key={i} className="rounded-lg border p-4">
                <summary className="cursor-pointer text-base font-medium">
                  {it["q"]}
                </summary>
                <p className="text-muted-foreground mt-2 text-sm">{it["a"]}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-muted/20 border-b">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              {c.contact["title"]}
            </h2>
            <p className="text-muted-foreground mt-3">
              {c.contact["subtitle"]}
            </p>
          </div>
          <form className="mx-auto mt-10 max-w-2xl space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  {c.contact["form"]["name"]["label"]}
                </label>
                <input
                  id="name"
                  name="name"
                  className="bg-background focus:ring-primary mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
                  placeholder={c.contact["form"]["name"]["placeholder"]}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  {c.contact["form"]["email"]["label"]}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="bg-background focus:ring-primary mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
                  placeholder={c.contact["form"]["email"]["placeholder"]}
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium">
                {c.contact["form"]["message"]["label"]}
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className="bg-background focus:ring-primary mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2"
                placeholder={c.contact["form"]["message"]["placeholder"]}
              />
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="bg-foreground text-background inline-flex items-center rounded-md px-5 py-2.5 hover:opacity-90"
              >
                {c.contact["form"]["submit"]}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-background">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {dic["site"]["name"]}.{" "}
              {c.footer["copyright"]}
            </div>
            <nav className="flex flex-wrap items-center gap-4 text-sm">
              <a href="#how-it-works" className="hover:underline">
                {c.footer["links"]["howItWorks"]}
              </a>
              <a href="#benefits" className="hover:underline">
                {c.footer["links"]["benefits"]}
              </a>
              <a href="#pricing" className="hover:underline">
                {c.footer["links"]["pricing"]}
              </a>
              <a href="#faq" className="hover:underline">
                {c.footer["links"]["faq"]}
              </a>
              <a href="#contact" className="hover:underline">
                {c.footer["links"]["contact"]}
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}
