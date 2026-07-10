"use client";

/**
 * Fullscreen entrance hall: a large artwork behind slow-fading type.
 */
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useRef } from "react";
import type { Artwork } from "@/lib/types";
import { MUSEUM_EASE } from "@/components/motion/motion-primitives";

export function Hero({ artwork }: { artwork: Artwork }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Slow parallax: the artwork recedes as the visitor walks in.
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);

  return (
    <section ref={ref} className="relative flex h-svh items-center justify-center overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <Image
          src={artwork.imageUrl}
          alt={artwork.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-canvas" />
      </motion.div>

      <div className="relative z-10 px-6 text-center text-white">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 0.2 }}
          className="text-[11px] tracking-[0.5em] uppercase text-white/70"
        >
          Where AI art becomes an exhibition
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease: MUSEUM_EASE }}
          className="mt-6 font-display text-6xl font-light tracking-[0.14em] sm:text-7xl md:text-8xl"
        >
          AI MUSEUM
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 1.0 }}
          className="mt-8 font-display text-xl font-light tracking-[0.35em] uppercase text-white/85 md:text-2xl"
        >
          Discover · Collect · Exhibit
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 1.5, ease: MUSEUM_EASE }}
          className="mt-12"
        >
          <Link
            href="/gallery"
            className="inline-block border border-white/60 px-10 py-4 text-[12px] tracking-[0.3em] uppercase transition-all duration-500 hover:border-white hover:bg-white hover:text-black"
          >
            Enter Museum
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/60"
        aria-hidden
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        >
          <ArrowDown className="h-5 w-5" strokeWidth={1} />
        </motion.div>
      </motion.div>
    </section>
  );
}
