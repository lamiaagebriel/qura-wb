import { cn } from "@/lib/utils";

export function AuthCard({
  className,
  children,
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-border rounded-[20px] border bg-white p-7 shadow-sm sm:p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AuthHeading({
  title,
  subtitle,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-col items-center gap-1.5 text-center", className)}>
      <h1 className="text-foreground text-[22px] font-bold tracking-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground text-[13.5px] leading-relaxed text-balance">
          {subtitle}
        </p>
      )}
    </div>
  );
}
