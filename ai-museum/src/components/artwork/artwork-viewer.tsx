"use client";

/**
 * The hero image on an artwork page: click (or the expand button) opens the
 * fullscreen Lightbox seeded with this piece plus its related works, enabling
 * keyboard navigation between them.
 */
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Expand } from "lucide-react";
import type { Artwork } from "@/lib/types";
import { Lightbox } from "@/components/artwork/lightbox";

export function ArtworkViewer({
  artwork,
  related,
}: {
  artwork: Artwork;
  related: Artwork[];
}) {
  const [open, setOpen] = useState(false);
  const sequence = [artwork, ...related];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View fullscreen"
        className="group relative block w-full cursor-zoom-in bg-surface"
      >
        <Image
          src={artwork.imageUrl}
          alt={`${artwork.title} — ${artwork.artist.displayName}`}
          width={artwork.width}
          height={artwork.height}
          priority
          sizes="(max-width: 1024px) 100vw, 62vw"
          className="h-auto max-h-[82vh] w-full object-contain"
        />
        <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <Expand className="h-4.5 w-4.5" strokeWidth={1.5} />
        </span>
      </button>

      <AnimatePresence>
        {open && <Lightbox artworks={sequence} startIndex={0} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
