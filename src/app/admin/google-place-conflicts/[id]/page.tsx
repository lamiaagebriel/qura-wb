import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getBusinessesConnectedToPlace,
  getCachedPlaceInfo,
  getGooglePlaceConflictById,
} from "@/lib/admin/queries";
import { isValidId } from "@/lib/id";

import { ConflictActions } from "../conflict-actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Google Place Conflict — Qura Admin" };
}

type PageProps = { params: Promise<{ id: string }> };

export default async function GooglePlaceConflictPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidId(id)) notFound();

  const conflict = await getGooglePlaceConflictById(id);
  if (!conflict) notFound();

  const [connectedBusinesses, cacheInfo] = await Promise.all([
    getBusinessesConnectedToPlace(conflict.googlePlaceId),
    getCachedPlaceInfo(conflict.googlePlaceId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/google-place-conflicts" className="text-primary text-[13px]">
        ← Back to conflicts
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-lg font-semibold">
          {conflict.googlePlaceId}
        </h1>
        <span className="text-muted-foreground text-[13px] capitalize">
          Status: {conflict.status}
        </span>
        <span className="text-muted-foreground text-[13px]">
          Recorded {new Date(conflict.createdAt).toLocaleString()}
        </span>
        <span className="text-muted-foreground text-[13px]">
          Connected businesses: {connectedBusinesses.length}
        </span>
        {cacheInfo ? (
          <span className="text-muted-foreground text-[13px]">
            Last successful Google fetch: {cacheInfo.fetchedAt.toLocaleString()}
            {" "}(cache age: {formatCacheAge(cacheInfo.cacheAgeMs)})
          </span>
        ) : (
          <span className="text-muted-foreground text-[13px]">
            No successful Google fetch recorded yet for this place.
          </span>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-foreground text-[13px] font-semibold">This event</h2>
        <div className="border-border grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium uppercase">
              Attempting business (new connection)
            </span>
            <BusinessLine
              name={conflict.attemptingBusiness?.name}
              username={conflict.attemptingBusiness?.username}
              ownerEmail={conflict.attemptingOwner?.email}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium uppercase">
              Existing business (connected first)
            </span>
            <BusinessLine
              name={conflict.existingBusiness?.name}
              username={conflict.existingBusiness?.username}
              ownerEmail={conflict.existingOwner?.email}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-foreground text-[13px] font-semibold">
          All businesses currently connected to this place ({connectedBusinesses.length})
        </h2>
        <ul className="divide-border flex flex-col divide-y rounded-lg border">
          {connectedBusinesses.map((block) => (
            <li key={block.businessId} className="flex flex-col px-4 py-3 leading-tight">
              <span className="text-foreground text-[13.5px] font-medium">
                {block.business.name}
              </span>
              <span className="text-muted-foreground text-xs">
                @{block.business.username} · connected {new Date(block.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <ConflictActions id={conflict.id} status={conflict.status} />
    </div>
  );
}

function formatCacheAge(ms: number): string {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) return "under an hour";
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function BusinessLine({
  name,
  username,
  ownerEmail,
}: {
  name?: string | null;
  username?: string | null;
  ownerEmail?: string | null;
}) {
  if (!name) {
    return <span className="text-muted-foreground text-[13px]">Business no longer exists</span>;
  }
  return (
    <div className="flex flex-col">
      <span className="text-foreground text-[13.5px] font-medium">{name}</span>
      <span className="text-muted-foreground text-xs">@{username}</span>
      {ownerEmail && <span className="text-muted-foreground text-xs">{ownerEmail}</span>}
    </div>
  );
}
