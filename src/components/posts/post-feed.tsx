"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { Spinner } from "@/components/ui/spinner";
import { useLocale } from "@/lib/i18n/provider";
import type { Post, PostType, PostPage } from "@/lib/posts";

import { loadMorePosts } from "./post-actions";
import { PostCard } from "./post-card";

/**
 * The city's posts (all, or one `type`) with infinite scroll: starts with the server's first page
 * and loads the next one as the end of the list nears. Re-mount it (`key`)
 * when the server sends a fresh first page (pull to refresh, a new post).
 */
export function PostFeed({
  type,
  first,
  signedIn,
}: {
  type: PostType | null;
  first: PostPage;
  signedIn: boolean;
}) {
  const { t } = useLocale();
  const [posts, setPosts] = useState<Post[]>(first.posts);
  const [next, setNext] = useState(first.next);
  const [failed, setFailed] = useState(false);
  const [loading, startLoading] = useTransition();
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !next || failed) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || loading) return;
        startLoading(async () => {
          try {
            const page = await loadMorePosts(type, next);
            // A post can move between pages while scrolling: skip repeats.
            setPosts((shown) => {
              const ids = new Set(shown.map((p) => p.id));
              return [...shown, ...page.posts.filter((p) => !ids.has(p.id))];
            });
            setNext(page.next);
          } catch {
            setFailed(true);
          }
        });
      },
      // Start loading well before the end is on screen.
      { rootMargin: "0px 0px 600px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [type, next, failed, loading]);

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {posts.map((post) => (
          <li key={post.id}>
            <PostCard post={post} signedIn={signedIn} />
          </li>
        ))}
      </ul>
      <div ref={sentinel} aria-hidden className="h-px" />
      {loading && (
        <div role="status" className="flex justify-center py-4">
          <Spinner className="size-5 text-muted-foreground" />
          <span className="sr-only">{t("Loading")}</span>
        </div>
      )}
      {failed && (
        <button
          type="button"
          onClick={() => setFailed(false)}
          className="min-h-11 text-sm font-medium text-primary"
        >
          {t("Couldn't load more. Tap to retry.")}
        </button>
      )}
      {!next && posts.length > 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t("You're all caught up")}
        </p>
      )}
    </div>
  );
}
