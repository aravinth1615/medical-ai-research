"use client";

import * as React from "react";

/** Live `matchMedia` result. The server (and hydration) assume desktop. */
export function useMediaQuery(query: string, serverValue = true): boolean {
  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}

export const DESKTOP_SIDEBAR = "(min-width: 1024px)";
