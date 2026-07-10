import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/motion-primitives";

export const metadata: Metadata = {
  title: "About",
  description: "About AI Museum — where AI art becomes an exhibition.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-32 pb-24 md:pt-44">
      <Reveal>
        <p className="museum-label">The institution</p>
        <h1 className="mt-3 font-display text-4xl font-light tracking-wide md:text-6xl">
          About AI Museum
        </h1>
        <div className="mt-10 space-y-6 leading-relaxed text-ink/80">
          <p className="font-display text-2xl font-light italic text-ink/90">
            Where AI art becomes an exhibition.
          </p>
          <p>
            AI Museum is not another feed. It is a museum: work is hung, not
            posted; exhibitions open, they don&apos;t trend; and visitors walk
            rooms rather than scroll timelines. Creators exhibit and curate;
            an in-house AI curator assembles a new exhibition every day.
          </p>
          <p>
            Every image here was imagined by a machine and chosen by a person.
            We believe that choice — the curation — is the art form this
            medium was missing.
          </p>
        </div>

        <div id="press" className="mt-16 border-t border-line pt-10">
          <p className="museum-label">Press</p>
          <p className="mt-4 text-sm text-muted">press@ai-museum.example</p>
        </div>
        <div id="contact" className="mt-10">
          <p className="museum-label">Contact</p>
          <p className="mt-4 text-sm text-muted">hello@ai-museum.example</p>
        </div>

        <Link
          href="/gallery"
          className="mt-14 inline-block border border-ink/25 px-10 py-4 text-[12px] tracking-[0.3em] uppercase transition-all duration-500 hover:border-accent hover:bg-accent hover:text-canvas"
        >
          Enter Museum
        </Link>
      </Reveal>
    </div>
  );
}
