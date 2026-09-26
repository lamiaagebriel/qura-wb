import { cn } from "cn"
// Updated: icons imported from the central icons file instead of @hugeicons/*.
import { HugeiconsIcon, Loading03Icon } from "@/components/icons"

// Updated: omit svg `strokeWidth` (string | number) — HugeiconsIcon only accepts a number.
function Spinner({ className, ...props }: Omit<React.ComponentProps<"svg">, "strokeWidth">) {
  return (
    <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
