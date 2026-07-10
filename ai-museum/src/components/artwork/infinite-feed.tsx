"use client";

/**
 * Infinite masonry feed. Fetches pages from /api/artworks via an
 * IntersectionObserver sentinel — no scroll listeners, no layout thrash.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Artwork, Page } from "@/lib/types";
import { MasonryGrid } from "@/components/artwork/masonry-grid";

interface Props {
  initialItems: Artwork[];
  initialCursor: string | null;
  /** Extra query params forwarded to the feed API (category, q, sort…). */
  params?: Record<string, string>;
}

export function InfiniteFeed({ initialItems, initialCursor, params = {} }: Props) {
  const [items, setItems] = useState<Artwork[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || cursor === null) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ ...params, cursor });
      const res = await fetch(`/api/artworks?${qs}`);
      if (!res.ok) throw new Error(`feed request failed: ${res.status}`);
      const page: Page<Artwork> = await res.json();
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      // Network hiccup — stop paginating quietly; the sentinel retries on
      // the next intersection.
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
    // params is stable for the lifetime of the page (comes from server props)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: "800px 0px" }, // start loading well before the edge
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div>
      <MasonryGrid artworks={items} />
      <div ref={sentinelRef} aria-hidden className="h-px" />
      {loading && (
        <p className="museum-label py-10 text-center" role="status">
          Hanging more works…
        </p>
      )}
      {cursor === null && items.length > 0 && (
        <p className="museum-label py-12 text-center">— End of the wing —</p>
      )}
    </div>
  );
}
