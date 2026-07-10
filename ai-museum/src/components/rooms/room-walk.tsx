"use client";

/**
 * The immersive walk through a room: works hang one or two at a time with a
 * lot of wall between them, drifting in with parallax as the visitor scrolls.
 */
import Image from "next/image";
import Link from "next/link";
import type { Artwork } from "@/lib/types";
import { Parallax, Reveal } from "@/components/motion/motion-primitives";

export function RoomWalk({ artworks, tint }: { artworks: Artwork[]; tint: string }) {
  return (
    <div className="wall-texture">
      <div className="mx-auto max-w-6xl space-y-28 px-5 py-24 md:space-y-44 md:px-8 md:py-36">
        {artworks.map((artwork, i) => {
          const alignRight = i % 2 === 1;
          return (
            <div
              key={artwork.id}
              className={`flex flex-col gap-8 md:flex-row md:items-center md:gap-16 ${
                alignRight ? "md:flex-row-reverse" : ""
              }`}
            >
              <Reveal className="md:w-3/5" y={40}>
                <Link href={`/artwork/${artwork.slug}`} className="group block">
                  <Parallax distance={35}>
                    <div
                      className="p-3 shadow-sm transition-shadow duration-700 group-hover:shadow-xl md:p-4"
                      style={{ backgroundColor: "var(--surface)" }}
                    >
                      <Image
                        src={artwork.imageUrl}
                        alt={`${artwork.title} — ${artwork.artist.displayName}`}
                        width={artwork.width}
                        height={artwork.height}
                        sizes="(max-width: 768px) 100vw, 55vw"
                        className="h-auto w-full"
                      />
                    </div>
                  </Parallax>
                </Link>
              </Reveal>

              {/* Wall label */}
              <Reveal delay={0.2} className="md:w-2/5">
                <div
                  className="inline-block border-l-2 pl-5"
                  style={{ borderColor: tint }}
                >
                  <p className="museum-label">
                    {String(i + 1).padStart(2, "0")} / {String(artworks.length).padStart(2, "0")}
                  </p>
                  <Link href={`/artwork/${artwork.slug}`}>
                    <h2 className="mt-3 font-display text-3xl font-light transition-colors hover:text-accent md:text-4xl">
                      {artwork.title}
                    </h2>
                  </Link>
                  <Link
                    href={`/artist/${artwork.artist.username}`}
                    className="mt-2 block text-sm text-muted transition-colors hover:text-accent"
                  >
                    {artwork.artist.displayName}
                  </Link>
                  <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink/70">
                    {artwork.description}
                  </p>
                  <p className="mt-3 text-xs text-muted">{artwork.model}</p>
                </div>
              </Reveal>
            </div>
          );
        })}
      </div>
    </div>
  );
}
