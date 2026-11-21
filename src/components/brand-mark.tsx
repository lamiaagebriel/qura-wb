/**
 * The app mark, drawn as vector shapes (no font needed, so it's identical
 * and crisp at every size). Placeholder until there's a real logo: replace
 * this SVG and every icon, splash image and the in-app splash update.
 */
export function Mark({
  size,
  color,
}: {
  size: number | string;
  color: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {/* "Q": a ring with a tail crossing it (not a magnifier) */}
      <circle
        cx="46"
        cy="46"
        r="30"
        fill="none"
        stroke={color}
        strokeWidth="13"
      />
      <path
        d="M57 57 L84 84"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  );
}
