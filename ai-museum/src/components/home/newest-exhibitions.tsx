import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { Exhibition } from "@/lib/types";
import { formatMonth } from "@/lib/utils";
import { HoverLift, Reveal } from "@/components/motion/motion-primitives";
import { SectionHeading } from "@/components/home/section-heading";

/** Horizontally scrolling rail of exhibition cards. */
export function NewestExhibitions({ exhibitions }: { exhibitions: Exhibition[] }) {
  return (
    <section className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading label="Just opened" title="Newest Exhibitions" href="/exhibitions" />
      </div>

      <div className="overflow-x-auto pb-4 [scrollbar-width:none]">
        <div className="mx-auto flex w-max gap-6 px-5 md:px-8">
          {exhibitions.map((ex, i) => (
            <Reveal key={ex.id} delay={i * 0.1} className="w-[300px] shrink-0 md:w-[380px]">
              <HoverLift>
                <Link href={`/exhibitions/${ex.slug}`} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={ex.coverUrl}
                      alt={ex.title}
                      fill
                      sizes="380px"
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/15" />
                  </div>
                  <div className="mt-4">
                    <p className="font-display text-xl transition-colors group-hover:text-accent md:text-2xl">
                      {ex.title}
                    </p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                      {formatMonth(ex.startsAt)} ·{" "}
                      {ex.curatedByAI ? (
                        <>
                          <Sparkles className="h-3 w-3 text-accent" strokeWidth={1.5} />
                          Curated by AI
                        </>
                      ) : (
                        <>Curated by {ex.curator?.displayName}</>
                      )}
                    </p>
                  </div>
                </Link>
              </HoverLift>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
