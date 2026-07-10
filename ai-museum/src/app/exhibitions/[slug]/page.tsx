import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getArtworksByIds, getExhibition } from "@/lib/data";
import { formatMonth } from "@/lib/utils";
import { Reveal } from "@/components/motion/motion-primitives";
import { MasonryGrid } from "@/components/artwork/masonry-grid";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exhibition = await getExhibition(slug);
  if (!exhibition) return { title: "Exhibition not found" };
  return { title: exhibition.title, description: exhibition.description };
}

export default async function ExhibitionPage({ params }: Props) {
  const { slug } = await params;
  const exhibition = await getExhibition(slug);
  if (!exhibition) notFound();

  const artworks = await getArtworksByIds(exhibition.artworkIds);

  return (
    <div>
      {/* Entrance wall */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden">
        <Image src={exhibition.coverUrl} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-canvas via-black/25 to-black/45" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-40 pb-14 md:px-8">
          <Link
            href="/exhibitions"
            className="mb-6 inline-flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            All exhibitions
          </Link>
          <h1 className="font-display text-5xl font-light tracking-wide text-white md:text-7xl">
            {exhibition.title}
          </h1>
          <p className="mt-3 font-display text-xl font-light italic text-white/80 md:text-2xl">
            {exhibition.subtitle}
          </p>
        </div>
      </section>

      {/* Curatorial statement */}
      <section className="mx-auto max-w-3xl px-5 py-16 text-center md:py-24">
        <Reveal>
          <p className="museum-label flex items-center justify-center gap-2">
            {exhibition.curatedByAI && <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />}
            {exhibition.curatedByAI ? "Curated by AI" : `Curated by ${exhibition.curator?.displayName}`}
            {" · "}
            {artworks.length} works · {formatMonth(exhibition.startsAt)}
            {exhibition.endsAt && ` — ${formatMonth(exhibition.endsAt)}`}
          </p>
          <p className="mt-8 font-display text-2xl font-light leading-relaxed text-ink/85 md:text-3xl">
            “{exhibition.description}”
          </p>
          {exhibition.curator && (
            <Link
              href={`/artist/${exhibition.curator.username}`}
              className="mt-8 inline-flex items-center gap-3 text-sm text-muted transition-colors hover:text-accent"
            >
              <span className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-line">
                <Image src={exhibition.curator.avatarUrl} alt="" fill sizes="36px" className="object-cover" />
              </span>
              Visit the curator
            </Link>
          )}
        </Reveal>
      </section>

      {/* The hang */}
      <section className="mx-auto max-w-7xl border-t border-line px-5 py-16 md:px-8 md:py-24">
        <MasonryGrid artworks={artworks} />
      </section>
    </div>
  );
}
