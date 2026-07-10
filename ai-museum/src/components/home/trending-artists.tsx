import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/types";
import { formatCount } from "@/lib/utils";
import { Reveal } from "@/components/motion/motion-primitives";
import { SectionHeading } from "@/components/home/section-heading";

export function TrendingArtists({ artists }: { artists: Artist[] }) {
  return (
    <section className="border-y border-line bg-surface-raised wall-texture">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-32">
        <SectionHeading label="This week" title="Trending Artists" href="/artists" />

        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
          {artists.map((artist, i) => (
            <Reveal key={artist.id} delay={i * 0.08}>
              <Link href={`/artist/${artist.username}`} className="group block text-center">
                <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full ring-1 ring-line transition-all duration-500 group-hover:ring-accent md:h-28 md:w-28">
                  <Image
                    src={artist.avatarUrl}
                    alt={artist.displayName}
                    fill
                    sizes="112px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="mt-4 text-sm transition-colors group-hover:text-accent">
                  {artist.displayName}
                </p>
                <p className="mt-1 text-[11px] tracking-[0.08em] text-muted">
                  {formatCount(artist.followers)} followers · {artist.worksCount} works
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
