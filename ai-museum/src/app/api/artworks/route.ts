import { NextRequest, NextResponse } from "next/server";
import { getArtworkFeed, type FeedFilters } from "@/lib/data";
import type { CategorySlug } from "@/lib/types";

/**
 * GET /api/artworks?cursor=12&category=minimal&q=fog&sort=popular
 *
 * Cursor-paginated feed powering infinite scroll. Backed by the data layer,
 * which will move to Supabase without changing this contract.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const filters: FeedFilters = {
    category: (sp.get("category") as CategorySlug) ?? undefined,
    artistId: sp.get("artist") ?? undefined,
    query: sp.get("q") ?? undefined,
    sort: (sp.get("sort") as FeedFilters["sort"]) ?? undefined,
  };
  const page = await getArtworkFeed(sp.get("cursor"), filters);
  return NextResponse.json(page, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
