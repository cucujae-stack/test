import type { Metadata } from "next";
import { getArtists, getArtworks, getCategories } from "@/lib/data";
import { SearchClient } from "@/components/search/search-client";

export const metadata: Metadata = {
  title: "Search",
  description: "Search artworks, artists, prompts, tags, models and styles.",
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  // The full public dataset is small enough to filter client-side for now;
  // with Supabase this becomes a trigram/text-search query (see schema).
  const [artworks, artists, categories] = await Promise.all([
    getArtworks(),
    getArtists(),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-5 pt-28 pb-24 md:px-8 md:pt-36">
      <p className="museum-label">Find anything</p>
      <h1 className="mt-3 font-display text-4xl font-light tracking-wide md:text-6xl">Search</h1>
      <SearchClient
        initialQuery={q ?? ""}
        artworks={artworks}
        artists={artists}
        categories={categories}
      />
    </div>
  );
}
