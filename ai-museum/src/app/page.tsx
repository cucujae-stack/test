import {
  getArtworkFeed,
  getArtworksByIds,
  getCategories,
  getExhibitions,
  getTodaysExhibition,
  getTrendingArtists,
} from "@/lib/data";
import { Hero } from "@/components/home/hero";
import { TodaysExhibition } from "@/components/home/todays-exhibition";
import { TrendingArtists } from "@/components/home/trending-artists";
import { NewestExhibitions } from "@/components/home/newest-exhibitions";
import { CategoriesStrip } from "@/components/home/categories-strip";
import { SectionHeading } from "@/components/home/section-heading";
import { InfiniteFeed } from "@/components/artwork/infinite-feed";

export default async function HomePage() {
  const [todays, exhibitions, artists, categories, feed] = await Promise.all([
    getTodaysExhibition(),
    getExhibitions(),
    getTrendingArtists(6),
    getCategories(),
    getArtworkFeed(null),
  ]);

  const [heroArtwork, exhibitionCover] = await Promise.all([
    getArtworksByIds(todays.artworkIds.slice(0, 1)).then((a) => a[0] ?? feed.items[0]),
    getArtworksByIds(todays.artworkIds.slice(1, 2)).then((a) => a[0] ?? null),
  ]);

  return (
    <>
      <Hero artwork={heroArtwork} />
      <TodaysExhibition exhibition={todays} cover={exhibitionCover} />
      <TrendingArtists artists={artists} />
      <NewestExhibitions exhibitions={exhibitions} />
      <CategoriesStrip categories={categories} />

      {/* Infinite artwork feed */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-32">
        <SectionHeading label="The permanent collection" title="Browse the Walls" href="/gallery" />
        <InfiniteFeed initialItems={feed.items} initialCursor={feed.nextCursor} />
      </section>
    </>
  );
}
