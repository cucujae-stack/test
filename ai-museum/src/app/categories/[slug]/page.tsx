import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArtworkFeed, getCategory } from "@/lib/data";
import { InfiniteFeed } from "@/components/artwork/infinite-feed";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found" };
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const feed = await getArtworkFeed(null, { category: category.slug });

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-20 md:px-8 md:pt-36">
      <p className="museum-label">Wing</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-wide md:text-6xl">
        {category.name}
      </h1>
      <p className="mt-4 max-w-lg text-muted">{category.description}</p>

      <div className="mt-12 border-t border-line pt-12">
        <InfiniteFeed
          initialItems={feed.items}
          initialCursor={feed.nextCursor}
          params={{ category: category.slug }}
        />
      </div>
    </div>
  );
}
