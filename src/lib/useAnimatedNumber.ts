"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Eases a displayed number toward `value` instead of jumping straight to it,
 * so summary cards feel alive when filters or new expenses change the total.
 */
export function useAnimatedNumber(value: number, durationMs = 500): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    const start = performance.now();
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, durationMs]);

  return display;
}
