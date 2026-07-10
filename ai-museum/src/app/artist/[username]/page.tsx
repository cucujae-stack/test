import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Link2 } from "lucide-react";
import {
  getArtist,
  getArtworks,
  getArtworksByIds,
  getCollectionsByOwner,
  getExhibitions,
} from "@/lib/data";
import { formatCount, formatMonth } from "@/lib/utils";
import { Reveal } from "@/components/motion/motion-primitives";
import { MasonryGrid } from "@/components/artwork/masonry-grid";
import { ProfileTabs, type ProfileTab } from "@/components/artist/profile-tabs";
import { FollowButton } from "@/components/artist/follow-button";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const artist = await getArtist(username);
  if (!artist) return { title: "Artist not found" };
  return { title: artist.displayName, description: artist.bio };
}

export default async function ArtistPage({ params, searchParams }: Props) {
  const [{ username }, sp] = await Promise.all([params, searchParams]);
  const artist = await getArtist(username);
  if (!artist) notFound();

  const tab = (sp.tab as ProfileTab) ?? "works";

  const [works, collections, allExhibitions] = await Promise.all([
    getArtworks({ artistId: artist.id }),
    getCollectionsByOwner(artist.id),
    getExhibitions(),
  ]);
  const exhibitions = allExhibitions.filter((e) => e.curator?.id === artist.id);

  // Liked / saved tabs show a sample set until per-user data is wired to
  // Supabase (likes/bookmarks tables exist in the schema).
  const liked = await getArtworksByIds(["w2", "w9", "w16", "w23", "w30"]);
  const saved = await getArtworksByIds(["w4", "w11", "w18", "w25"]);

  return (
    <div className="pt-16 md:pt-20">
      {/* Banner */}
      <div className="relative h-56 overflow-hidden md:h-80">
        <Image
          src={artist.bannerUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Identity row */}
        <Reveal className="-mt-14 flex flex-col items-start gap-6 md:-mt-16 md:flex-row md:items-end">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full ring-4 ring-canvas md:h-36 md:w-36">
            <Image src={artist.avatarUrl} alt={artist.displayName} fill sizes="144px" className="object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-4xl font-light md:text-5xl">{artist.displayName}</h1>
            <p className="mt-1 text-sm text-muted">@{artist.username} · Member since {formatMonth(artist.createdAt)}</p>
          </div>
          <FollowButton initialFollowers={artist.followers} />
        </Reveal>

        {/* Bio + stats */}
        <Reveal delay={0.1} className="mt-8 grid gap-8 md:grid-cols-[2fr_1fr]">
          <div>
            <p className="max-w-xl leading-relaxed text-ink/80">{artist.bio}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {artist.website && (
                <a
                  href={artist.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-muted transition-colors hover:text-accent"
                >
                  <Globe className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Website
                </a>
              )}
              {artist.socials.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-muted capitalize transition-colors hover:text-accent"
                >
                  <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {s.platform}
                </a>
              ))}
            </div>
          </div>
          <dl className="flex gap-10 border-l border-line pl-8 text-sm md:justify-end md:gap-12">
            <div>
              <dd className="font-display text-3xl">{formatCount(artist.followers)}</dd>
              <dt className="museum-label mt-1">Followers</dt>
            </div>
            <div>
              <dd className="font-display text-3xl">{formatCount(artist.following)}</dd>
              <dt className="museum-label mt-1">Following</dt>
            </div>
            <div>
              <dd className="font-display text-3xl">{works.length}</dd>
              <dt className="museum-label mt-1">Works</dt>
            </div>
          </dl>
        </Reveal>

        {/* Tabs */}
        <div className="mt-12">
          <ProfileTabs username={artist.username} active={tab} />
        </div>

        <div className="py-10">
          {tab === "works" && <MasonryGrid artworks={works} />}
          {tab === "liked" && <MasonryGrid artworks={liked} />}
          {tab === "saved" && <MasonryGrid artworks={saved} />}

          {tab === "collections" && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href="/collections"
                  className="group border border-line p-6 transition-colors duration-500 hover:border-accent"
                >
                  <p className="font-display text-2xl transition-colors group-hover:text-accent">{c.name}</p>
                  <p className="mt-2 text-sm text-muted">{c.description}</p>
                  <p className="museum-label mt-4">{c.artworkIds.length} works</p>
                </Link>
              ))}
              {collections.length === 0 && <EmptyNote text="No public collections yet." />}
            </div>
          )}

          {tab === "exhibitions" && (
            <div className="grid gap-8 sm:grid-cols-2">
              {exhibitions.map((e) => (
                <Link
                  key={e.id}
                  href={`/exhibitions/${e.slug}`}
                  className="group relative block aspect-[16/7] overflow-hidden"
                >
                  <Image src={e.coverUrl} alt={e.title} fill sizes="50vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-6">
                    <div className="text-white">
                      <p className="font-display text-2xl">{e.title}</p>
                      <p className="text-xs text-white/70">
                        {e.artworkIds.length} works · {formatMonth(e.startsAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
              {exhibitions.length === 0 && <EmptyNote text="No exhibitions curated yet." />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="py-16 text-center text-sm text-muted">{text}</p>;
}
