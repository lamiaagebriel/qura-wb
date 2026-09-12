"use client";

/**
 * Local, durable staging for an image the user picked but hasn't
 * published yet — the composer's whole "select now, upload only at
 * Post/Save" flow depends on this surviving a page reload (a draft
 * reopened later) and being independent of the original file still
 * existing on disk (nothing here ever re-reads the source `File`, only
 * the `Blob` bytes copied out of it at selection time).
 *
 * A raw `indexedDB` wrapper, not a library — the surface here is three
 * operations on one object store, not worth a dependency for. This is
 * the first IndexedDB usage in the app.
 */

const DB_NAME = "qura-pending-images";
const DB_VERSION = 1;
const STORE_NAME = "pendingImages";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = run(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function putPendingImage(id: string, blob: Blob): Promise<void> {
  await withStore("readwrite", (store) => store.put(blob, id));
}

export async function getPendingImage(id: string): Promise<Blob | undefined> {
  const result = await withStore<Blob | undefined>("readonly", (store) =>
    store.get(id),
  );
  return result ?? undefined;
}

export async function deletePendingImage(id: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(id));
}
