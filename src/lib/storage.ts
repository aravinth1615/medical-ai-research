"use client";

import * as React from "react";

/**
 * State mirrored to localStorage — a per-browser convenience for drafts and
 * checklists until the backend stores them. Built on useSyncExternalStore so
 * the server render and hydration agree (the server snapshot is "nothing
 * stored"), other tabs stay in step, and blocked storage degrades to the
 * initial value instead of throwing.
 */

const CHANGE_EVENT = "omnimed:storage";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function usePersistentState<T>(key: string, initial: T) {
  const raw = React.useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null
  );
  const hydrated = React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const value = React.useMemo<T>(() => {
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
    // `initial` is a default, not an input — callers pass a fresh literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const save = React.useCallback(
    (next: T) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Blocked storage: nothing persists, and the value stays as it was.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key]
  );

  return [value, save, hydrated] as const;
}
