import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/motion-primitives";

/** Consistent section header: label, serif title, optional "view all". */
export function SectionHeading({
  label,
  title,
  href,
  hrefLabel = "View all",
}: {
  label: string;
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <Reveal className="mb-10 flex items-end justify-between gap-6 md:mb-14">
      <div>
        <p className="museum-label">{label}</p>
        <h2 className="mt-3 font-display text-3xl font-light tracking-wide md:text-5xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 items-center gap-2 text-[12px] tracking-[0.15em] uppercase text-muted transition-colors hover:text-accent sm:flex"
        >
          {hrefLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
        </Link>
      )}
    </Reveal>
  );
}
