import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-background relative flex min-h-svh flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="bg-primary/10 absolute top-0 left-1/2 h-[420px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl" />
        <div className="absolute top-16 right-[8%] h-[220px] w-[220px] rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <header className="container flex h-16 shrink-0 items-center justify-center">
        <Link
          href="/"
          className="text-foreground text-[19px] font-bold tracking-tight"
        >
          qura<span className="text-primary">.</span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pt-4 pb-16 sm:px-6">
        {children}
      </main>
    </div>
  );
}
