import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// iPadOS reports itself as a Mac, so a touch-capable "Mac" counts too.
function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** True on iPhone and iPad; false on the server and everywhere else. */
export function useIsIos() {
  return useSyncExternalStore(subscribe, isIos, () => false);
}
