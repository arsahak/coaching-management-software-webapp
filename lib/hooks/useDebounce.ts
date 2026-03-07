import { useCallback, useRef } from "react";

/**
 * Custom hook for debouncing function calls
 * @param callback The function to debounce
 * @param delay Delay in milliseconds (default: 500ms)
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { debouncedCallback, cancel };
}
