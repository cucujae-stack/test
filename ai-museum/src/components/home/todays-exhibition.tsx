import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Artwork, Exhibition } from "@/lib/types";
import { formatMonth } from "@/lib/utils";
import { Parallax, Reveal } from "@/components/motion/motion-primitives";
import { SectionHeading } from "@/components/home/section-heading";

export function TodaysExhibition({
  exhibition,
  cover,
}: {
  exhibition: Exhibition;
  cover: Artwork | null;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-32">
      <SectionHeading label="Today's Exhibition" title={exhibition.title} />

      <div className="grid items-center gap-10 lg:grid-cols-[3fr_2fr] lg:gap-16">
        <Reveal>
          <Link href={`/exhibitions/${exhibition.slug}`} className="group block overflow-hidden">
            <Parallax distance={30}>
              <Image
                src={cover?.imageUrl ?? exhibition.coverUrl}
                alt={exhibition.title}
                width={1400}
                height={900}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="h-auto w-full scale-105 transition-transform duration-1000 ease-out group-hover:scale-100"
              />
            </Parallax>
          </Link>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="font-display text-2xl font-light italic text-muted md:text-3xl">
            {exhibition.subtitle}
          </p>
          <p className="mt-6 max-w-md leading-relaxed text-ink/80">{exhibition.description}</p>

          <dl className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="museum-label">Curator</dt>
              <dd className="flex items-center gap-1.5">
                {exhibition.curatedByAI && <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />}
                {exhibition.curatedByAI ? "Curated by AI" : exhibition.curator?.displayName}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="museum-label">Works</dt>
              <dd>{exhibition.artworkIds.length}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="museum-label">On view</dt>
              <dd>{formatMonth(exhibition.startsAt)}</dd>
            </div>
          </dl>

          <Link
            href={`/exhibitions/${exhibition.slug}`}
            className="group mt-10 inline-flex items-center gap-3 border border-ink/25 px-8 py-3.5 text-[12px] tracking-[0.25em] uppercase transition-all duration-500 hover:border-accent hover:bg-accent hover:text-canvas"
          >
            Open Exhibition
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
