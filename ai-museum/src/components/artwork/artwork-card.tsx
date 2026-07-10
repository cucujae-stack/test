"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Expand, Heart, Share2 } from "lucide-react";
import type { Artwork } from "@/lib/types";
import { cn, formatCount } from "@/lib/utils";
import { MUSEUM_EASE } from "@/components/motion/motion-primitives";

/**
 * A framed artwork in the masonry feed. Hover reveals a quiet overlay with
 * like / bookmark / share / fullscreen. Like & bookmark are optimistic local
 * state until Supabase auth is connected.
 */
export function ArtworkCard({
  artwork,
  priority = false,
}: {
  artwork: Artwork;
  priority?: boolean;
}) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const share = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/artwork/${artwork.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: artwork.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, ease: MUSEUM_EASE }}
      className="group relative mb-5 break-inside-avoid md:mb-7"
    >
      <Link href={`/artwork/${artwork.slug}`} className="block">
        <div className="relative overflow-hidden bg-surface">
          <Image
            src={artwork.imageUrl}
            alt={`${artwork.title} — ${artwork.artist.displayName}`}
            width={artwork.width}
            height={artwork.height}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1400px) 33vw, 25vw"
            className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />

          {/* Hover veil */}
          <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/55 via-transparent to-black/25 p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="flex justify-end gap-2">
              <OverlayButton
                label={liked ? "Unlike" : "Like"}
                active={liked}
                onClick={(e) => {
                  e.preventDefault();
                  setLiked((v) => !v);
                }}
              >
                <Heart className={cn("h-4 w-4", liked && "fill-current")} strokeWidth={1.5} />
              </OverlayButton>
              <OverlayButton
                label={saved ? "Remove bookmark" : "Bookmark"}
                active={saved}
                onClick={(e) => {
                  e.preventDefault();
                  setSaved((v) => !v);
                }}
              >
                <Bookmark className={cn("h-4 w-4", saved && "fill-current")} strokeWidth={1.5} />
              </OverlayButton>
              <OverlayButton label="Share" onClick={share}>
                <Share2 className="h-4 w-4" strokeWidth={1.5} />
              </OverlayButton>
              <OverlayButton label="View fullscreen" asSpan>
                <Expand className="h-4 w-4" strokeWidth={1.5} />
              </OverlayButton>
            </div>
            <div className="text-white">
              <p className="font-display text-lg leading-snug">{artwork.title}</p>
              <p className="mt-0.5 text-xs text-white/70">
                {artwork.artist.displayName} · {formatCount(artwork.likes + (liked ? 1 : 0))} likes
              </p>
            </div>
          </div>
        </div>
      </Link>

      {/* Wall label under the frame */}
      <div className="mt-2.5 flex items-baseline justify-between gap-3 px-0.5">
        <p className="truncate text-[13px] text-ink/85">{artwork.title}</p>
        <p className="shrink-0 text-[11px] tracking-[0.08em] text-muted">
          {artwork.artist.displayName}
        </p>
      </div>
    </motion.article>
  );
}

function OverlayButton({
  children,
  label,
  onClick,
  active = false,
  asSpan = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: (e: React.MouseEvent) => void;
  active?: boolean;
  asSpan?: boolean;
}) {
  const cls = cn(
    "flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors duration-300",
    active ? "bg-white text-accent" : "bg-white/15 text-white hover:bg-white/30",
  );
  // The fullscreen affordance is part of the wrapping link, so render a span.
  if (asSpan) {
    return (
      <span className={cls} aria-hidden>
        {children}
      </span>
    );
  }
  return (
    <button type="button" aria-label={label} aria-pressed={active} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}
