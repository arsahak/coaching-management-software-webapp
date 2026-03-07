import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Custom hook for fetching data with abort controller
 */
export function useFetch<T>(
  fetchFunction: (signal?: AbortSignal) => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const refetch = useCallback(async () => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(abortControllerRef.current.signal);
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    refetch();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  return { data, loading, error, refetch };
}
