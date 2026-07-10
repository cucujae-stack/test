import Link from "next/link";
import type { Category } from "@/lib/types";
import { Reveal } from "@/components/motion/motion-primitives";
import { SectionHeading } from "@/components/home/section-heading";

export function CategoriesStrip({ categories }: { categories: Category[] }) {
  return (
    <section className="border-y border-line bg-surface-raised">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <SectionHeading label="Wings of the museum" title="Categories" />
        <div className="flex flex-wrap gap-3">
          {categories.map((cat, i) => (
            <Reveal key={cat.slug} delay={i * 0.04}>
              <Link
                href={`/categories/${cat.slug}`}
                className="block border border-line bg-canvas px-6 py-3.5 font-display text-lg tracking-wide transition-all duration-500 hover:border-accent hover:text-accent md:px-8 md:text-xl"
              >
                {cat.name}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
