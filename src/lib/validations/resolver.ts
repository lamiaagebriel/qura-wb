import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * Thin wrapper around `zodResolver` — use this everywhere instead of
 * importing `zodResolver` directly.
 *
 * `@hookform/resolvers`'s zod-v4 type overload hardcodes the exact zod
 * minor version it was built against (`_zod.version.minor` as a literal),
 * so any zod v4 minor release past that fails to *type-check* even though
 * the resolver works correctly at runtime — this project is on zod 4.4.x,
 * the resolver was typed against 4.0.x. Known upstream bug, still open as
 * of `@hookform/resolvers@5.4.0`:
 * https://github.com/react-hook-form/resolvers/issues/842
 *
 * Remove this wrapper (and go back to calling `zodResolver` directly) once
 * that's fixed upstream.
 */
export function createZodResolver<T extends FieldValues>(
  schema: ZodType<T>,
): Resolver<T> {
  return zodResolver(schema as never) as Resolver<T>;
}
