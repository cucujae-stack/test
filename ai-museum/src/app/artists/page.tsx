import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getArtists } from "@/lib/data";
import { formatCount } from "@/lib/utils";
import { Reveal } from "@/components/motion/motion-primitives";

export const metadata: Metadata = {
  title: "Artists",
  description: "The creators exhibiting at AI Museum.",
};

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-8 md:pt-36">
      <p className="museum-label">The people behind the prompts</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-wide md:text-6xl">Artists</h1>

      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist, i) => (
          <Reveal key={artist.id} delay={i * 0.06}>
            <Link
              href={`/artist/${artist.username}`}
              className="group block overflow-hidden border border-line transition-colors duration-500 hover:border-accent"
            >
              <div className="relative h-32 overflow-hidden">
                <Image
                  src={artist.bannerUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              </div>
              <div className="relative px-6 pb-7">
                <div className="relative -mt-10 h-20 w-20 overflow-hidden rounded-full ring-4 ring-canvas">
                  <Image src={artist.avatarUrl} alt={artist.displayName} fill sizes="80px" className="object-cover" />
                </div>
                <p className="mt-4 font-display text-2xl transition-colors group-hover:text-accent">
                  {artist.displayName}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{artist.bio}</p>
                <p className="museum-label mt-4">
                  {formatCount(artist.followers)} followers · {artist.worksCount} works
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
