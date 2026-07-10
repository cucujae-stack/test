"use client";

/**
 * Route-level page transition: every navigation fades the new page in like
 * walking into the next gallery room.
 */
import { motion } from "framer-motion";
import { MUSEUM_EASE } from "@/components/motion/motion-primitives";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: MUSEUM_EASE }}
    >
      {children}
    </motion.div>
  );
}
