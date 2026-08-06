"use client";

import { useState } from "react";

import { ComposeBox } from "@/components/compose-box";
import { ThreadCard, type ThreadCardData } from "@/components/thread-card";

/** The focused thread + its pinned reply box, together — so posting a
 * reply can bump this thread's own reply count the instant it succeeds
 * instead of waiting on `router.refresh()` to re-fetch it. */
export function ThreadDetail({
  thread,
  currentUserId,
  user,
  placeholder,
}: {
  thread: ThreadCardData;
  currentUserId?: string;
  user: Parameters<typeof ComposeBox>[0]["user"];
  placeholder: string;
}) {
  const [replyCount, setReplyCount] = useState(thread.replyCount);

  const [prevServerReplyCount, setPrevServerReplyCount] = useState(
    thread.replyCount,
  );
  if (thread.replyCount !== prevServerReplyCount) {
    setPrevServerReplyCount(thread.replyCount);
    setReplyCount(thread.replyCount);
  }

  return (
    <>
      <ThreadCard
        thread={{ ...thread, replyCount }}
        currentUserId={currentUserId}
        linkToDetail={false}
      />

      <div className="border-border/60 bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t py-3 backdrop-blur-md">
        <div className="container">
          <ComposeBox
            user={user}
            parentId={thread.id}
            placeholder={placeholder}
            onPosted={() => setReplyCount((c) => c + 1)}
          />
        </div>
      </div>
    </>
  );
}
