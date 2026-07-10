import type { Artwork } from "@/lib/types";
import { ArtworkCard } from "@/components/artwork/artwork-card";
import { cn } from "@/lib/utils";

/**
 * Pinterest-style masonry using CSS columns — no JS layout, so it streams
 * with server rendering and images keep their intrinsic aspect ratios.
 */
export function MasonryGrid({
  artworks,
  className,
  priorityCount = 0,
}: {
  artworks: Artwork[];
  className?: string;
  priorityCount?: number;
}) {
  return (
    <div className={cn("columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4 md:gap-7", className)}>
      {artworks.map((artwork, i) => (
        <ArtworkCard key={artwork.id} artwork={artwork} priority={i < priorityCount} />
      ))}
    </div>
  );
}
