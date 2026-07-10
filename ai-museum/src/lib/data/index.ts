/**
 * Data-access layer.
 *
 * Every function here is async and shaped like the eventual Supabase query
 * (see /supabase/migrations for the schema). Today they read from the mock
 * dataset; to go live, replace the bodies with Supabase calls — the
 * signatures and return types stay identical.
 */
import {
  ARTISTS,
  ARTWORKS,
  CATEGORIES,
  COLLECTIONS,
  COMMENTS,
  EXHIBITIONS,
  ROOMS,
} from "@/lib/data/mock";
import type {
  Artist,
  ArtComment,
  Artwork,
  Category,
  CategorySlug,
  Collection,
  Exhibition,
  Page,
  Room,
} from "@/lib/types";

const FEED_PAGE_SIZE = 12;

export interface FeedFilters {
  category?: CategorySlug;
  artistId?: string;
  query?: string;
  sort?: "newest" | "popular" | "views";
}

function applyFilters(items: Artwork[], f: FeedFilters): Artwork[] {
  let out = items.filter((w) => w.visibility === "public");
  if (f.category) out = out.filter((w) => w.category === f.category);
  if (f.artistId) out = out.filter((w) => w.artistId === f.artistId);
  if (f.query) {
    const q = f.query.toLowerCase();
    out = out.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.description.toLowerCase().includes(q) ||
        w.artist.displayName.toLowerCase().includes(q) ||
        w.artist.username.toLowerCase().includes(q) ||
        w.model.toLowerCase().includes(q) ||
        (w.prompt ?? "").toLowerCase().includes(q) ||
        w.tags.some((t) => t.includes(q)),
    );
  }
  switch (f.sort) {
    case "popular":
      out = [...out].sort((a, b) => b.likes - a.likes);
      break;
    case "views":
      out = [...out].sort((a, b) => b.views - a.views);
      break;
    default:
      out = [...out].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      );
  }
  return out;
}

/** Cursor-paginated artwork feed (cursor = offset encoded as string). */
export async function getArtworkFeed(
  cursor: string | null,
  filters: FeedFilters = {},
): Promise<Page<Artwork>> {
  const all = applyFilters(ARTWORKS, filters);
  const offset = cursor ? parseInt(cursor, 10) || 0 : 0;
  const items = all.slice(offset, offset + FEED_PAGE_SIZE);
  const next = offset + FEED_PAGE_SIZE;
  return {
    items,
    nextCursor: next < all.length ? String(next) : null,
  };
}

export async function getArtworks(filters: FeedFilters = {}): Promise<Artwork[]> {
  return applyFilters(ARTWORKS, filters);
}

export async function getArtwork(id: string): Promise<Artwork | null> {
  return ARTWORKS.find((w) => w.id === id || w.slug === id) ?? null;
}

export async function getRelatedArtworks(artwork: Artwork, limit = 6): Promise<Artwork[]> {
  return ARTWORKS.filter(
    (w) =>
      w.id !== artwork.id &&
      (w.category === artwork.category || w.artistId === artwork.artistId),
  ).slice(0, limit);
}

export async function getArtworksByIds(ids: string[]): Promise<Artwork[]> {
  const byId = new Map(ARTWORKS.map((w) => [w.id, w]));
  return ids.map((id) => byId.get(id)).filter((w): w is Artwork => Boolean(w));
}

export async function getComments(artworkId: string): Promise<ArtComment[]> {
  return COMMENTS.filter((c) => c.artworkId === artworkId);
}

export async function getArtists(): Promise<Artist[]> {
  return ARTISTS;
}

export async function getTrendingArtists(limit = 6): Promise<Artist[]> {
  return [...ARTISTS].sort((a, b) => b.followers - a.followers).slice(0, limit);
}

export async function getArtist(username: string): Promise<Artist | null> {
  return ARTISTS.find((a) => a.username === username || a.id === username) ?? null;
}

export async function getExhibitions(): Promise<Exhibition[]> {
  return [...EXHIBITIONS].sort(
    (a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt),
  );
}

export async function getExhibition(slug: string): Promise<Exhibition | null> {
  return EXHIBITIONS.find((e) => e.slug === slug || e.id === slug) ?? null;
}

/** "Today's Exhibition" — the featured one, else the most recent. */
export async function getTodaysExhibition(): Promise<Exhibition> {
  return EXHIBITIONS.find((e) => e.featured) ?? EXHIBITIONS[0];
}

export async function getRooms(): Promise<Room[]> {
  return ROOMS;
}

export async function getRoom(slug: string): Promise<Room | null> {
  return ROOMS.find((r) => r.slug === slug) ?? null;
}

export async function getCollections(): Promise<Collection[]> {
  return COLLECTIONS.filter((c) => c.isPublic);
}

export async function getCollectionsByOwner(ownerId: string): Promise<Collection[]> {
  return COLLECTIONS.filter((c) => c.ownerId === ownerId && c.isPublic);
}

export async function getCategories(): Promise<Category[]> {
  return CATEGORIES;
}

export async function getCategory(slug: string): Promise<Category | null> {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}
