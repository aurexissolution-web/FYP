"use client";

import { useEffect, useRef } from "react";

/*
  Animated numeral. Server-renders the FINAL value, so search engines, no-JS
  visitors and Reduce Motion users all see the real figure. When motion is
  allowed it resets to 0 on mount and eases up once scrolled into view.

  The animation writes `textContent` directly instead of going through state:
  no re-render per frame, and React never needs to reconcile the number.
  `format` is a name rather than a function because props crossing the
  server → client boundary must be serialisable.
*/
type Format = "integer" | "percent0" | "percent1";

function fmt(n: number, format: Format) {
  switch (format) {
    case "percent0":
      return `${Math.round(n * 100)}%`;
    case "percent1":
      return `${(n * 100).toFixed(1)}%`;
    default:
      // Fixed locale so server and client markup match byte-for-byte.
      return Math.round(n).toLocaleString("en-US");
  }
}

export function CountUp({
  value,
  format = "integer",
  duration = 1800,
  className,
}: {
  value: number;
  format?: Format;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    el.textContent = fmt(0, format);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = fmt(value * eased, format);
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = fmt(value, format);
    };
  }, [value, format, duration]);

  return (
    <span ref={ref} className={className}>
      {fmt(value, format)}
    </span>
  );
}
