import type { Metadata } from "next";
import Link from "next/link";
import { getArtworkFeed, getCategories } from "@/lib/data";
import type { CategorySlug } from "@/lib/types";
import type { FeedFilters } from "@/lib/data";
import { InfiniteFeed } from "@/components/artwork/infinite-feed";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Browse the permanent collection of AI-generated artwork.",
};

interface Props {
  searchParams: Promise<{ category?: string; sort?: string }>;
}

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "popular", label: "Most loved" },
  { key: "views", label: "Most viewed" },
] as const;

export default async function GalleryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const category = sp.category as CategorySlug | undefined;
  const sort = (sp.sort as FeedFilters["sort"]) ?? "newest";

  const [feed, categories] = await Promise.all([
    getArtworkFeed(null, { category, sort }),
    getCategories(),
  ]);

  const feedParams: Record<string, string> = { sort: sort ?? "newest" };
  if (category) feedParams.category = category;

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <p className="museum-label">The permanent collection</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-wide md:text-6xl">Gallery</h1>

      {/* Filter rail */}
      <div className="mt-10 flex flex-wrap items-center gap-2 border-y border-line py-4">
        <FilterChip href={`/gallery?sort=${sort}`} active={!category} label="All" />
        {categories.map((c) => (
          <FilterChip
            key={c.slug}
            href={`/gallery?category=${c.slug}&sort=${sort}`}
            active={category === c.slug}
            label={c.name}
          />
        ))}
        <span className="mx-3 hidden h-4 w-px bg-line sm:block" />
        {SORTS.map((s) => (
          <FilterChip
            key={s.key}
            href={category ? `/gallery?category=${category}&sort=${s.key}` : `/gallery?sort=${s.key}`}
            active={sort === s.key}
            label={s.label}
            subtle
          />
        ))}
      </div>

      <div className="mt-10">
        <InfiniteFeed
          key={`${category ?? "all"}-${sort}`}
          initialItems={feed.items}
          initialCursor={feed.nextCursor}
          params={feedParams}
        />
      </div>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
  subtle = false,
}: {
  href: string;
  label: string;
  active: boolean;
  subtle?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "px-3.5 py-1.5 text-[12px] tracking-[0.08em] transition-all duration-300",
        subtle ? "uppercase text-[11px]" : "",
        active
          ? "bg-ink text-canvas"
          : "text-muted hover:text-accent",
      )}
    >
      {label}
    </Link>
  );
}
