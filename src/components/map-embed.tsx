// A Google Maps view of one spot with its pin (the keyless embed — not
// interactive). Size it from the parent.

export function MapEmbed({
  location: { lat, lng },
  label,
  locale,
}: {
  location: { lat: number; lng: number };
  label: string;
  locale: string;
}) {
  const params = new URLSearchParams({
    q: `${lat},${lng}`,
    z: "16",
    hl: locale,
    output: "embed",
  });
  return (
    <iframe
      src={`https://maps.google.com/maps?${params}`}
      title={label}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      tabIndex={-1}
      aria-hidden
      className="pointer-events-none size-full border-0"
    />
  );
}
