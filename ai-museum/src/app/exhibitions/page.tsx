import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getExhibitions } from "@/lib/data";
import { formatMonth } from "@/lib/utils";
import { Reveal } from "@/components/motion/motion-primitives";

export const metadata: Metadata = {
  title: "Exhibitions",
  description: "Current and past curated exhibitions at AI Museum.",
};

export default async function ExhibitionsPage() {
  const exhibitions = await getExhibitions();
  const [current, ...past] = exhibitions;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-8 md:pt-36">
      <p className="museum-label">Programme</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-wide md:text-6xl">
        Exhibitions
      </h1>

      {/* Feature the most recent */}
      <Reveal className="mt-14">
        <Link href={`/exhibitions/${current.slug}`} className="group relative block aspect-[21/9] min-h-[320px] overflow-hidden">
          <Image
            src={current.coverUrl}
            alt={current.title}
            fill
            priority
            sizes="100vw"
            className="object-cover transition-transform duration-[1500ms] group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-12">
            <p className="text-[10px] tracking-[0.35em] uppercase text-white/70">Now showing</p>
            <p className="mt-3 font-display text-4xl font-light md:text-6xl">{current.title}</p>
            <p className="mt-2 text-sm text-white/75">{current.subtitle}</p>
            <p className="mt-4 flex items-center gap-2 text-xs text-white/60">
              {current.artworkIds.length} works · {formatMonth(current.startsAt)} ·{" "}
              {current.curatedByAI ? (
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" strokeWidth={1.5} /> Curated by AI
                </span>
              ) : (
                <>Curated by {current.curator?.displayName}</>
              )}
            </p>
          </div>
        </Link>
      </Reveal>

      {/* The rest */}
      <div className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2">
        {past.map((ex, i) => (
          <Reveal key={ex.id} delay={i * 0.08}>
            <Link href={`/exhibitions/${ex.slug}`} className="group block">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={ex.coverUrl}
                  alt={ex.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              </div>
              <p className="mt-5 font-display text-3xl font-light transition-colors group-hover:text-accent">
                {ex.title}
              </p>
              <p className="mt-1 text-sm text-muted">{ex.subtitle}</p>
              <p className="museum-label mt-3">
                {ex.artworkIds.length} works · {formatMonth(ex.startsAt)} ·{" "}
                {ex.curatedByAI ? "Curated by AI" : `Curated by ${ex.curator?.displayName}`}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
