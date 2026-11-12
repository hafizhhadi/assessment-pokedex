"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `onInView` whenever the returned ref's element is on (or near) the screen.
 * Used for infinite scroll: put the ref on an element at the end of the list.
 *
 * The observer is recreated whenever `enabled` or `onInView` changes, and a new observer
 * reports the current visibility straight away, so a still-visible element triggers again.
 */
export function useInView<T extends Element>(onInView: () => void, enabled: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onInView();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [enabled, onInView]);

  return ref;
}
