"use client";

/**
 * The corridor of doorways on /rooms. Each door is a tall panel that widens
 * softly on hover and cross-fades its interior — an invitation, not a card.
 */
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Room } from "@/lib/types";
import { MUSEUM_EASE } from "@/components/motion/motion-primitives";

export function RoomDoors({ rooms }: { rooms: Room[] }) {
  return (
    <div className="mt-14 flex h-[70vh] min-h-[420px] flex-col gap-2 px-2 md:flex-row md:px-4">
      {rooms.map((room, i) => (
        <motion.div
          key={room.slug}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: i * 0.12, ease: MUSEUM_EASE }}
          whileHover={{ flexGrow: 2.2 }}
          className="group relative flex-1 overflow-hidden"
          style={{ flexGrow: 1 }}
        >
          <Link href={`/rooms/${room.slug}`} className="absolute inset-0 block">
            <Image
              src={room.coverUrl}
              alt={room.name}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
            />
            <div
              className="absolute inset-0 opacity-60 transition-opacity duration-700 group-hover:opacity-35"
              style={{ backgroundColor: room.tint }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
              <p className="text-[10px] tracking-[0.4em] uppercase text-white/60">{room.theme}</p>
              <p className="mt-2 font-display text-3xl font-light md:text-4xl">{room.name}</p>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/70 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
                {room.description}
              </p>
              <p className="mt-4 text-[10px] tracking-[0.35em] uppercase text-white/0 transition-colors duration-700 group-hover:text-white/80">
                Enter →
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
