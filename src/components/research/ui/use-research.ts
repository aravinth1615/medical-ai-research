"use client";

import * as React from "react";
import { onResearchChange } from "@/lib/research/service";
import type { ApiResult } from "@/lib/research/types";

/**
 * Loads one research resource for a screen and keeps it current: `loading`
 * only for the first load, then silent refreshes whenever any research data
 * changes (another screen saving, a run finishing) or `reload()` is called.
 * A failed refresh keeps the last good data on screen.
 */
export function useResearch<T>(load: () => Promise<ApiResult<T>>, deps: React.DependencyList) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0);
  const loadRef = React.useRef(load);
  React.useLayoutEffect(() => {
    loadRef.current = load;
  });

  React.useEffect(() => {
    let cancelled = false;
    loadRef.current().then((res) => {
      if (cancelled) return;
      if (res.error === null) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  React.useEffect(() => onResearchChange(() => setTick((n) => n + 1)), []);

  const reload = React.useCallback(() => setTick((n) => n + 1), []);
  return { data, error, loading, reload, setData };
}
