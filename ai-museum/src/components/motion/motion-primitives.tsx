"use client";

/**
 * Shared Framer Motion primitives.
 *
 * All museum animation goes through these so the whole site moves with one
 * voice: slow fades, gentle rises, a single easing curve. Nothing bounces.
 */
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

/** The house easing — a long decelerating curve. */
export const MUSEUM_EASE = [0.22, 1, 0.36, 1] as const;

interface RevealProps {
  children: ReactNode;
  /** Seconds to wait before animating (used to stagger siblings). */
  delay?: number;
  /** Pixels the element rises from. */
  y?: number;
  className?: string;
  /** Animate every time it enters the viewport instead of once. */
  repeat?: boolean;
}

/** Fade + rise on scroll into view. The default entrance for everything. */
export function Reveal({ children, delay = 0, y = 24, className, repeat = false }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !repeat, margin: "-60px" }}
      transition={{ duration: 0.9, delay, ease: MUSEUM_EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Slow opacity-only fade, for hero text and large images. */
export function Fade({ children, delay = 0, className }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Subtle parallax wrapper — content drifts slower than the scroll. */
export function Parallax({
  children,
  distance = 60,
  className,
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/** Scale-on-hover for artwork frames. Deliberately restrained. */
export function HoverLift({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.5, ease: MUSEUM_EASE }}
    >
      {children}
    </motion.div>
  );
}
