"use client";

import { useEffect, useRef, type ReactNode } from "react";

/*
  Marks a subtree for entrance animation. On mount (JS running, motion
  allowed) it sets `data-motion`, which lets CSS put children into their
  hidden start state; when the element scrolls into view it sets
  `data-inview`, which starts the animations. See the [data-inview] rules in
  globals.css.

  Without JS, or under Reduce Motion, neither attribute is ever set and every
  child renders in its finished state — nothing can be left hidden.
*/
export function InView({
  children,
  className,
  threshold = 0.3,
}: {
  children: ReactNode;
  className?: string;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.dataset.motion = "";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.inview = "";
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
