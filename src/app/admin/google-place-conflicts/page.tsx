import type { Metadata } from "next";
import Link from "next/link";

import { getGooglePlaceConflicts } from "@/lib/admin/queries";
import { getLocale } from "@/lib/i18n/actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Google Place Conflicts — Qura Admin" };
}

const STATUS_LABEL: Record<string, string> = {
  conflict: "Conflict",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

type PageProps = { searchParams: Promise<{ cursor?: string }> };

export default async function GooglePlaceConflictsPage({ searchParams }: PageProps) {
  const { t } = await getLocale();
  const { cursor: cursorParam } = await searchParams;
  const cursor = cursorParam ? Number(cursorParam) : 0;
  const { items, nextCursor } = await getGooglePlaceConflicts(
    Number.isFinite(cursor) ? cursor : 0,
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-foreground text-lg font-semibold">
        {t("Google Place Conflicts")}
      </h1>
      <p className="text-muted-foreground text-[13px]">
        {t(
          "Every event where a Qura business connected to a Google Place that another business already connects to. Connecting is always allowed — this list is for review, not enforcement.",
        )}
      </p>

      {items.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-[13px]">
          {t("No conflicts recorded.")}
        </p>
      )}

      <ul className="divide-border flex flex-col divide-y rounded-lg border">
        {items.map((conflict) => (
          <li key={conflict.id}>
            <Link
              href={`/admin/google-place-conflicts/${conflict.id}`}
              className="hover:bg-muted flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex flex-col leading-tight">
                <span className="text-foreground text-[13.5px] font-medium">
                  {conflict.googlePlaceId}
                </span>
                <span className="text-muted-foreground text-xs">
                  {conflict.attemptingBusiness?.name ?? t("Unknown business")}
                  {" → "}
                  {conflict.existingBusiness?.name ?? t("Unknown business")}
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(conflict.createdAt).toLocaleString()}
                </span>
              </div>
              <span className="text-muted-foreground text-xs font-medium capitalize">
                {STATUS_LABEL[conflict.status] ?? conflict.status}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {nextCursor !== null && (
        <Link
          href={`/admin/google-place-conflicts?cursor=${nextCursor}`}
          className="text-primary text-center text-[13px] font-medium"
        >
          {t("Load more")}
        </Link>
      )}
    </div>
  );
}
